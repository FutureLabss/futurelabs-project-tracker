import { URL } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("admin lifecycle, project membership, audit, and session authorization", async () => {
  const db = new PGlite();
  const admin = "10000000-0000-4000-8000-000000000001";
  const member = "10000000-0000-4000-8000-000000000002";
  const manager = "10000000-0000-4000-8000-000000000003";
  const sessions = {
    [admin]: "20000000-0000-4000-8000-000000000001",
    [member]: "20000000-0000-4000-8000-000000000002",
    [manager]: "20000000-0000-4000-8000-000000000003",
  };
  const asUser = (id, fn, jti = sessions[id]) =>
    db.transaction(async (tx) => {
      await tx.exec("set local role authenticated");
      await tx.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [id, JSON.stringify({ iss: "project-tracker", jti })],
      );
      return fn(tx);
    });
  const rpc = (id, fn, operation, payload) =>
    asUser(
      id,
      async (tx) =>
        (
          await tx.query(`select public.${fn}($1,$2::jsonb) as result`, [
            operation,
            JSON.stringify(payload),
          ])
        ).rows[0].result,
    );
  const mutate = (operation, payload, id = admin) =>
    rpc(id, "tracker_mutate", operation, payload);
  const govern = (operation, payload, id = admin) =>
    rpc(id, "tracker_admin_mutate", operation, payload);
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;",
    );
    await db.exec(
      "alter default privileges grant execute on functions to anon, authenticated;",
    );
    const directory = new URL("../supabase/migrations/", import.meta.url);
    for (const file of readdirSync(directory)
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.transaction(async (tx) => {
        await tx.exec(readFileSync(new URL(file, directory), "utf8"));
      });
    // Match hosted Supabase default grants: private business helpers must not
    // remain callable by API roles after the complete migration chain.
    const permissions = await db.query(`select
      has_function_privilege('authenticated', 'private.mutate_business(text,jsonb)', 'execute') as business,
      has_function_privilege('authenticated', 'private.record_event(uuid,public.ledger_subject_type,public.ledger_change_type,text,text,text)', 'execute') as audit,
      has_table_privilege('service_role', 'public.profiles', 'select') as profile_read`);
    assert.equal(permissions.rows[0].business, false);
    assert.equal(permissions.rows[0].audit, false);
    assert.equal(permissions.rows[0].profile_read, true);
    for (const [id, role] of [
      [admin, "admin"],
      [member, "member"],
      [manager, "manager"],
    ]) {
      await db.query(
        "insert into profiles(id,name,email,role,status) values($1,$2::text,'test@example.test',$2::text::user_role,'active')",
        [id, role],
      );
      await db.query(
        "insert into tracker_sessions(id,lms_user_id,expires_at) values($1,$2,now()+interval '15 minutes')",
        [sessions[id], id],
      );
    }
    const project = await mutate("create_project", {
      name: "Admin delivery",
      goal: "Full lifecycle",
      start_date: "2026-09-01",
      target_date: "2026-10-01",
      manager_id: manager,
    });
    const access = {
      project_id: project.id,
      person_id: member,
      included: true,
    };
    await assert.rejects(
      govern("set_project_member", access, member),
      /Administrator/,
    );
    await assert.rejects(
      govern("set_project_member", access, manager),
      /Administrator/,
    );
    await assert.rejects(
      asUser(
        admin,
        (tx) =>
          tx.query("select tracker_admin_mutate('set_project_member',$1)", [
            access,
          ]),
        "forged",
      ),
      /session expired/,
    );
    await assert.rejects(
      asUser(admin, (tx) =>
        tx.query("insert into project_members values($1,$2)", [
          project.id,
          member,
        ]),
      ),
      /permission denied/,
    );
    assert.equal(
      (await asUser(member, (tx) => tx.query("select * from projects"))).rows
        .length,
      0,
    );
    await govern("set_project_member", access);
    await govern("set_project_member", access); // Idempotent grant, one event.
    assert.equal(
      (
        await db.query(
          "select * from ledger_records where type='project_member_added'",
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (await asUser(member, (tx) => tx.query("select * from projects"))).rows
        .length,
      1,
    );
    assert.equal(
      (await asUser(member, (tx) => tx.query("select * from project_members")))
        .rows.length,
      0,
    );
    assert.equal(
      (await asUser(admin, (tx) => tx.query("select * from project_members")))
        .rows.length,
      1,
    );
    const task = await mutate("create_task", {
      project_id: project.id,
      title: "Ship workflow",
      description: "Test",
      assignee_id: member,
      complexity: "mid",
      origin: "planned",
      due_date: "2099-09-20",
    });
    await assert.rejects(
      govern("close_project", { project_id: project.id }),
      /open tasks/,
    );
    await assert.rejects(
      govern("set_project_member", { ...access, included: false }),
      /Reassign/,
    );
    const blockerInput = {
      task_id: task.id,
      category: "external",
      description: "Waiting",
      owner_id: member,
    };
    // Only the assignee declares a blocker, starts or submits their own work.
    await assert.rejects(mutate("raise_blocker", blockerInput), /Only the task's assignee/);
    await assert.rejects(
      mutate("update_task_status", { task_id: task.id, status: "in_progress" }),
      /Only the task's assignee/,
    );
    await assert.rejects(
      mutate("submit_task", { task_id: task.id, notes: "Not mine" }, manager),
      /Only the task's assignee/,
    );
    const blocker = await mutate("raise_blocker", blockerInput, member);
    // Administrators may own work (20261020000100); here the project manager takes it over.
    const adminOwned = await mutate("assign_task", { task_id: task.id, assignee_id: admin });
    assert.equal(adminOwned.assignee_id, admin);
    // An admin works on their own task like any assignee.
    const ownWork = await mutate("create_task", {
      project_id: project.id,
      title: "Admin's own work",
      assignee_id: admin,
      complexity: "low",
      origin: "planned",
      due_date: "2099-09-21",
    });
    await mutate("update_task_status", { task_id: ownWork.id, status: "in_progress" });
    await mutate("submit_task", { task_id: ownWork.id, notes: "Done" });
    await mutate("accept_task", { task_id: ownWork.id });
    // Due dates cannot be set in the past, on create or reschedule.
    await assert.rejects(
      mutate("create_task", {
        project_id: project.id,
        title: "Already late",
        assignee_id: admin,
        complexity: "low",
        origin: "planned",
        due_date: "2020-01-01",
      }),
      /cannot be in the past/,
    );
    await assert.rejects(
      mutate("reschedule_task", { task_id: task.id, due_date: "2020-01-01", reason: "Too late" }),
      /cannot be in the past/,
    );
    await mutate("assign_task", { task_id: task.id, assignee_id: manager });
    await assert.rejects(
      govern("set_project_member", { ...access, included: false }),
      /blockers/,
    );
    await mutate("clear_blocker", { blocker_id: blocker.id });
    await mutate("reschedule_task", {
      task_id: task.id,
      due_date: "2099-09-25",
      reason: "Provider delay",
    });
    await mutate(
      "submit_task",
      {
        task_id: task.id,
        notes: "Review ready",
        deliverable_url: "https://example.test/delivery",
      },
      manager,
    );
    await assert.rejects(
      mutate("return_task", { task_id: task.id, reason: " " }),
      /reason/,
    );
    await mutate("return_task", {
      task_id: task.id,
      reason: "Add documentation",
    });
    await mutate("submit_task", { task_id: task.id, notes: "Updated docs" }, manager);
    await mutate("accept_task", { task_id: task.id });
    await govern("set_project_member", { ...access, included: false });
    assert.equal(
      (await asUser(member, (tx) => tx.query("select * from projects"))).rows
        .length,
      0,
    );
    const closed = await govern("close_project", { project_id: project.id });
    assert.equal(closed.state, "closed");
    await assert.rejects(
      mutate("create_task", {
        project_id: project.id,
        title: "Too late",
        assignee_id: manager,
        complexity: "low",
        origin: "planned",
        due_date: "2099-09-25",
      }),
      /active project/,
    );
    await assert.rejects(
      mutate("assign_project_manager", {
        project_id: project.id,
        manager_id: admin,
      }),
      /Closed projects/,
    );
    const events = (await db.query("select type from ledger_records")).rows.map(
      (r) => r.type,
    );
    for (const event of [
      "project_created",
      "project_member_added",
      "project_member_removed",
      "task_created",
      "blocker_raised",
      "blocker_cleared",
      "task_redated",
      "task_returned",
      "task_accepted",
      "project_closed",
    ])
      assert.ok(events.includes(event), event);
    await db.query("update profiles set status='inactive' where id=$1", [
      manager,
    ]);
    await assert.rejects(
      mutate("create_project", {
        name: "Inactive lead",
        start_date: "2026-09-01",
        target_date: "2026-09-30",
        manager_id: manager,
      }),
      /active manager/,
    );
    await db.query(
      "update tracker_sessions set revoked_at=now() where lms_user_id=$1",
      [admin],
    );
    await assert.rejects(
      govern("close_project", { project_id: project.id }),
      /session expired/,
    );
    await assert.rejects(
      asUser(admin, (tx) =>
        tx.query("select private.mutate_scoped('create_project','{}')"),
      ),
      /permission denied/,
    );
    const bootstrap = readFileSync(
      new URL("../supabase/bootstrap-admin.sql", import.meta.url),
      "utf8",
    ).replace("REPLACE_WITH_TRACKER_AUTH_USER_UUID", admin);
    await db.query(
      "insert into auth.users(id,email,email_confirmed_at) values($1,'admin@example.test',now())",
      [admin],
    );
    await db.exec(bootstrap);
    await db.exec(bootstrap);
    const link = await db.query(
      "select profile_id from tracker_auth_links where auth_user_id=$1",
      [admin],
    );
    assert.equal(link.rows[0].profile_id, admin);
    const profile = await db.query(
      "select role,status from profiles where id=$1",
      [admin],
    );
    assert.deepEqual(profile.rows[0], { role: "admin", status: "active" });
  } finally {
    await db.close();
  }
});

test("people administration: create, update profile, role change, status, last-admin guard, session revocation", async () => {
  const db = new PGlite();
  const admin = "10000000-0000-4000-8000-000000000001";
  const member = "10000000-0000-4000-8000-000000000002";
  const manager = "10000000-0000-4000-8000-000000000003";
  const sessions = {
    [admin]: "20000000-0000-4000-8000-000000000001",
    [member]: "20000000-0000-4000-8000-000000000002",
    [manager]: "20000000-0000-4000-8000-000000000003",
  };
  const asUser = (id, fn, jti = sessions[id]) =>
    db.transaction(async (tx) => {
      await tx.exec("set local role authenticated");
      await tx.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [id, JSON.stringify({ iss: "project-tracker", jti })],
      );
      return fn(tx);
    });
  const rpc = (id, fn, operation, payload) =>
    asUser(
      id,
      async (tx) =>
        (
          await tx.query(`select public.${fn}($1,$2::jsonb) as result`, [
            operation,
            JSON.stringify(payload),
          ])
        ).rows[0].result,
    );
  const mutate = (operation, payload, id = admin) =>
    rpc(id, "tracker_mutate", operation, payload);
  const govern = (operation, payload, id = admin) =>
    rpc(id, "tracker_admin_mutate", operation, payload);

  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;",
    );
    await db.exec(
      "alter default privileges grant execute on functions to anon, authenticated;",
    );
    const directory = new URL("../supabase/migrations/", import.meta.url);
    for (const file of readdirSync(directory)
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.transaction(async (tx) => {
        await tx.exec(readFileSync(new URL(file, directory), "utf8"));
      });

    for (const [id, role] of [
      [admin, "admin"],
      [member, "member"],
      [manager, "manager"],
    ]) {
      await db.query(
        "insert into profiles(id,name,email,role,status) values($1,$2::text,$2::text || '@example.test',$2::text::user_role,'active')",
        [id, role],
      );
      await db.query(
        "insert into tracker_sessions(id,lms_user_id,expires_at) values($1,$2,now()+interval '15 minutes')",
        [sessions[id], id],
      );
    }

    // 1. Non-admin cannot create a person
    await assert.rejects(
      govern("create_person", { name: "Bob", email: "bob@example.test", role: "member" }, member),
      /Administrator/,
    );


    // 2. Admin creates a person
    const created = await govern("create_person", {
      name: "Bob Builder",
      email: "bob@example.test",
      role: "member",
      title: "Core Engineer",
    });
    assert.equal(created.name, "Bob Builder");
    assert.equal(created.email, "bob@example.test");
    assert.equal(created.role, "member");
    assert.equal(created.status, "active");

    const personEvent = await db.query(
      "select type, subject_type, actor_id from ledger_records where subject_id = $1 order by occurred_at desc limit 1",
      [created.id],
    );


    assert.equal(personEvent.rows[0].type, "person_created");
    assert.equal(personEvent.rows[0].subject_type, "person");
    assert.equal(personEvent.rows[0].actor_id, admin);

    // 3. Admin updates person profile
    const updated = await govern("update_profile", {
      person_id: created.id,
      name: "Robert Builder",
      title: "Lead Engineer",
    });
    assert.equal(updated.name, "Robert Builder");
    assert.equal(updated.title, "Lead Engineer");

    // 4. Last active admin protection: cannot demote the only active admin
    await assert.rejects(
      govern("change_role", { person_id: admin, role: "member" }),
      /Cannot demote the last active administrator/,
    );

    // 5. Last active admin protection: cannot deactivate the only active admin
    await assert.rejects(
      govern("set_person_status", { person_id: admin, status: "inactive" }),
      /Cannot deactivate the last active administrator/,
    );


    // 6. Demoting a manager to member unassigns project lead
    const project = await mutate("create_project", {
      name: "Managed project",
      goal: "Test manager unassignment",
      start_date: "2026-09-01",
      target_date: "2026-10-01",
      manager_id: manager,
    });
    const projBefore = await db.query("select manager_id from projects where id = $1", [project.id]);
    assert.equal(projBefore.rows[0].manager_id, manager);

    await govern("change_role", { person_id: manager, role: "member" });
    const projAfter = await db.query("select manager_id from projects where id = $1", [project.id]);
    assert.equal(projAfter.rows[0].manager_id, null);

    // 7. Deactivating member revokes their active sessions
    await db.query(
      "insert into tracker_sessions(id,lms_user_id,expires_at) values($1,$2,now()+interval '15 minutes')",
      ["30000000-0000-4000-8000-000000000001", created.id],
    );
    const activeSessionsBefore = await db.query(
      "select count(*) as count from tracker_sessions where lms_user_id = $1 and revoked_at is null",
      [created.id],
    );
    assert.equal(Number(activeSessionsBefore.rows[0].count), 1);

    await govern("set_person_status", { person_id: created.id, status: "inactive" });
    const activeSessionsAfter = await db.query(
      "select count(*) as count from tracker_sessions where lms_user_id = $1 and revoked_at is null",
      [created.id],
    );
    assert.equal(Number(activeSessionsAfter.rows[0].count), 0);

    // 8. Explicit session revocation
    await db.query(
      "insert into tracker_sessions(id,lms_user_id,expires_at) values($1,$2,now()+interval '15 minutes')",
      ["30000000-0000-4000-8000-000000000002", member],
    );
    await govern("revoke_sessions", { person_id: member });
    const memberActiveSessions = await db.query(
      "select count(*) as count from tracker_sessions where lms_user_id = $1 and revoked_at is null",
      [member],
    );
    assert.equal(Number(memberActiveSessions.rows[0].count), 0);
  } finally {
    await db.close();
  }
});

