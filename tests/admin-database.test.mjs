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
      due_date: "2026-09-20",
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
    // Administrators are never task owners; the project manager takes it over.
    await assert.rejects(
      mutate("assign_task", { task_id: task.id, assignee_id: admin }),
      /Administrators cannot be assigned tasks/,
    );
    await mutate("assign_task", { task_id: task.id, assignee_id: manager });
    await assert.rejects(
      govern("set_project_member", { ...access, included: false }),
      /blockers/,
    );
    await mutate("clear_blocker", { blocker_id: blocker.id });
    await mutate("reschedule_task", {
      task_id: task.id,
      due_date: "2026-09-25",
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
        due_date: "2026-09-25",
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
  } finally {
    await db.close();
  }
});

test("people administration: LMS-managed grants, adoption, roles, revocation, last-admin guard, sessions", async () => {
  const db = new PGlite();
  const admin = "10000000-0000-4000-8000-000000000001";
  const member = "10000000-0000-4000-8000-000000000002";
  const manager = "10000000-0000-4000-8000-000000000003";
  const lmsAdmin = "40000000-0000-4000-8000-000000000001";
  const lmsNewcomer = "40000000-0000-4000-8000-000000000002";
  const lmsManager = "40000000-0000-4000-8000-000000000003";
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
  // What the sync-lms-access and SSO functions run with the service role.
  const sync = async (lmsId, active, name = null, email = null, role = null) =>
    (
      await db.query("select (apply_lms_access($1,$2,$3,$4,$5)).*", [
        lmsId,
        name,
        email,
        role,
        active,
      ])
    ).rows[0];
  const liveSessions = async (id) =>
    Number(
      (
        await db.query(
          "select count(*) as count from tracker_sessions where lms_user_id = $1 and revoked_at is null",
          [id],
        )
      ).rows[0].count,
    );

  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;",
    );
    await db.exec(
      "alter default privileges grant execute on functions to anon, authenticated;",
    );
    const directory = new URL("../supabase/migrations/", import.meta.url);
    const files = readdirSync(directory)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const managed = files.indexOf("20261030000100_lms_managed_access.sql");
    const apply = async (batch) => {
      for (const file of batch)
        await db.transaction(async (tx) => {
          await tx.exec(readFileSync(new URL(file, directory), "utf8"));
        });
    };
    await apply(files.slice(0, managed));

    // People created in the Tracker before the LMS took over, signed in by password.
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
    await apply(files.slice(managed));

    // 1. The cut-over ends every password-era session and removes password links.
    assert.equal(await liveSessions(admin), 0);
    assert.equal(
      (await db.query("select to_regclass('public.tracker_auth_links') as t"))
        .rows[0].t,
      null,
    );
    await db.query("update tracker_sessions set revoked_at = null");

    // 2. People, roles and account status can no longer be changed in the Tracker.
    for (const [operation, payload] of [
      ["create_person", { name: "Bob", email: "bob@example.test", role: "member" }],
      ["change_role", { person_id: member, role: "manager" }],
      ["set_person_status", { person_id: member, status: "inactive" }],
    ])
      await assert.rejects(govern(operation, payload), /managed in the LMS/);

    // 3. API roles cannot apply LMS access themselves.
    await assert.rejects(
      asUser(admin, (tx) =>
        tx.query(
          "select apply_lms_access($1,'X','x@example.test','admin',true)",
          [admin],
        ),
      ),
      /permission denied/,
    );

    // 4. A first grant for an existing email adopts that profile and its history.
    const adopted = await sync(
      lmsAdmin,
      true,
      "Admin From LMS",
      " Admin@Example.Test ",
      "admin",
    );
    assert.equal(adopted.id, admin);
    assert.equal(adopted.name, "Admin From LMS");
    assert.equal(adopted.email, "admin@example.test");
    assert.equal(
      (await sync(lmsAdmin, true, "Admin From LMS", "admin@example.test", "admin"))
        .id,
      admin,
    );

    // 5. A grant for someone new creates their profile under their LMS id.
    const created = await sync(
      lmsNewcomer,
      true,
      "Bob Builder",
      "bob@example.test",
      "member",
    );
    assert.equal(created.id, lmsNewcomer);
    assert.equal(created.role, "member");
    assert.equal(created.status, "active");
    const personEvent = await db.query(
      "select type, subject_type, actor_id from ledger_records where subject_id = $1 order by occurred_at desc limit 1",
      [created.id],
    );
    assert.deepEqual(personEvent.rows[0], {
      type: "person_created",
      subject_type: "person",
      actor_id: created.id,
    });

    // 6. Profile details stay editable in the Tracker.
    const updated = await govern("update_profile", {
      person_id: created.id,
      title: "Lead Engineer",
    });
    assert.equal(updated.title, "Lead Engineer");

    // 7. The last active administrator cannot be demoted or revoked from the LMS.
    await assert.rejects(
      sync(lmsAdmin, true, "Admin From LMS", "admin@example.test", "member"),
      /last active administrator/,
    );
    await assert.rejects(sync(lmsAdmin, false), /last active administrator/);

    // 8. Demoting a manager in the LMS keeps them on their projects as a member.
    const project = await mutate("create_project", {
      name: "Managed project",
      goal: "Test manager unassignment",
      start_date: "2026-09-01",
      target_date: "2026-10-01",
      manager_id: manager,
    });
    assert.equal(
      (await sync(lmsManager, true, "Manager", "manager@example.test", "manager"))
        .id,
      manager,
    );
    const demoted = await sync(
      lmsManager,
      true,
      "Manager",
      "manager@example.test",
      "member",
    );
    assert.equal(demoted.role, "member");
    const projAfter = await db.query(
      "select manager_id from projects where id = $1",
      [project.id],
    );
    assert.equal(projAfter.rows[0].manager_id, null);
    assert.equal(
      (
        await db.query(
          "select 1 from project_members where project_id=$1 and lms_user_id=$2",
          [project.id, manager],
        )
      ).rows.length,
      1,
    );
    const roleEvent = await db.query(
      "select from_value, to_value from ledger_records where subject_id = $1 and type = 'role_changed'",
      [manager],
    );
    assert.deepEqual(roleEvent.rows[0], {
      from_value: "manager",
      to_value: "member",
    });

    // 9. Revoking in the LMS deactivates the profile and ends its sessions; a regrant restores it.
    await db.query(
      "insert into tracker_sessions(id,lms_user_id,expires_at) values($1,$2,now()+interval '15 minutes')",
      ["30000000-0000-4000-8000-000000000001", created.id],
    );
    assert.equal(await liveSessions(created.id), 1);
    assert.equal((await sync(lmsNewcomer, false)).status, "inactive");
    assert.equal(await liveSessions(created.id), 0);
    assert.equal((await sync(lmsNewcomer, false)).status, "inactive");
    assert.equal(
      (await sync(lmsNewcomer, true, "Bob Builder", "bob@example.test", "manager"))
        .status,
      "active",
    );

    // 10. Revoking someone the Tracker never knew is a no-op.
    assert.equal(
      (
        await db.query("select apply_lms_access($1,null,null,null,false) as p", [
          "40000000-0000-4000-8000-0000000000ff",
        ])
      ).rows[0].p,
      null,
    );

    // 11. Explicit session revocation stays a Tracker admin action.
    await govern("revoke_sessions", { person_id: member });
    assert.equal(await liveSessions(member), 0);
  } finally {
    await db.close();
  }
});
