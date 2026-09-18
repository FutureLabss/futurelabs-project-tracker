import { URL } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL execution; only Supabase's managed Auth schema/JWT helper are simulated.
test("Supabase migrations and database authorization", async (t) => {
  const db = new PGlite();
  const ids = {
    admin: "00000000-0000-4000-8000-000000000001",
    manager: "00000000-0000-4000-8000-000000000002",
    member: "00000000-0000-4000-8000-000000000003",
    other: "00000000-0000-4000-8000-000000000004",
  };
  async function asUser(id, fn) {
    return db.transaction(async (tx) => {
      await tx.exec("set local role authenticated");
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
        id ?? "",
      ]);
      return fn(tx);
    });
  }
  const mutate = (id, operation, payload) =>
    asUser(
      id,
      async (tx) =>
        (
          await tx.query(
            "select public.tracker_mutate($1, $2::jsonb) as result",
            [operation, JSON.stringify(payload)],
          )
        ).rows[0].result,
    );
  try {
    await db.exec(
      "create role anon; create role authenticated; create schema auth; " +
        "create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb); " +
        "create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$; " +
        "grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;",
    );
    for (const migration of [
      "20260908000100_tracker_schema.sql",
      "20260908000200_tracker_mutations.sql",
    ]) {
      await db.exec(
        readFileSync(
          new URL("../supabase/migrations/" + migration, import.meta.url),
          "utf8",
        ),
      );
    }
    for (const [name, id] of Object.entries(ids)) {
      await db.query(
        "insert into auth.users(id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)",
        [id, name + "@example.com", JSON.stringify({ name, role: "admin" })],
      );
    }
    await t.test("profile creation ignores self-supplied roles", async () => {
      const result = await db.query("select role from public.profiles");
      assert.ok(result.rows.every((row) => row.role === "member"));
    });
    await db.query("update public.profiles set role = 'admin' where id = $1", [
      ids.admin,
    ]);
    await db.query(
      "update public.profiles set role = 'manager' where id = $1",
      [ids.manager],
    );
    const projectInput = {
      name: "Integration project",
      goal: "Validate workflows",
      start_date: "2026-09-01",
      target_date: "2026-10-01",
      manager_id: ids.manager,
    };
    const project = await mutate(ids.admin, "create_project", projectInput);
    const taskInput = {
      project_id: project.id,
      title: "Test work",
      description: "",
      assignee_id: ids.member,
      complexity: "mid",
      origin: "planned",
      due_date: "2026-09-20",
    };
    const task = await mutate(ids.manager, "create_task", taskInput);

    await t.test(
      "anonymous and unprovisioned callers cannot access tracker data",
      async () => {
        await assert.rejects(
          db.transaction(async (tx) => {
            await tx.exec("set local role anon");
            await tx.query("select * from public.tasks");
          }),
        );
        await assert.rejects(
          mutate(null, "create_project", projectInput),
          /Authentication/,
        );
        const rows = await asUser(
          "00000000-0000-4000-8000-000000000099",
          (tx) => tx.query("select * from public.tasks"),
        );
        assert.equal(rows.rows.length, 0);
      },
    );
    await t.test(
      "members cannot escalate roles, bypass RPC, or change peer tasks",
      async () => {
        await assert.rejects(
          asUser(ids.member, (tx) =>
            tx.query(
              "update public.profiles set role = 'admin' where id = $1",
              [ids.member],
            ),
          ),
          /permission denied/,
        );
        await assert.rejects(
          asUser(ids.member, (tx) =>
            tx.query(
              "update public.tasks set status = 'accepted' where id = $1",
              [task.id],
            ),
          ),
          /permission denied/,
        );
        await assert.rejects(
          mutate(ids.member, "create_project", projectInput),
          /administrators/,
        );
        await assert.rejects(
          mutate(ids.other, "update_task_status", {
            task_id: task.id,
            status: "in_progress",
          }),
          /another member/,
        );
        await assert.rejects(
          mutate(ids.member, "create_task", {
            ...taskInput,
            origin: "unplanned",
            assignee_id: null,
          }),
          /not permitted/,
        );
        await assert.rejects(
          mutate(ids.member, "accept_task", { task_id: task.id }),
          /project manager/,
        );
      },
    );
    await t.test(
      "reschedule validation rolls back and audit actor comes from JWT",
      async () => {
        const before = (
          await db.query(
            "select count(*)::int as count from public.ledger_records",
          )
        ).rows[0].count;
        await assert.rejects(
          mutate(ids.manager, "reschedule_task", {
            task_id: task.id,
            due_date: "2026-09-25",
            reason: " ",
          }),
          /reason/,
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int as count from public.ledger_records",
            )
          ).rows[0].count,
          before,
        );
        await mutate(ids.manager, "reschedule_task", {
          task_id: task.id,
          due_date: "2026-09-25",
          reason: "Dependency delayed",
          actor_id: ids.admin,
        });
        const event = (
          await db.query(
            "select * from public.ledger_records where type = 'task_redated'",
          )
        ).rows[0];
        assert.equal(event.actor_id, ids.manager);
        assert.equal(event.reason, "Dependency delayed");
      },
    );
    await t.test(
      "blocker failure is atomic; resolution updates task and ledger",
      async () => {
        await assert.rejects(
          mutate(ids.member, "raise_blocker", {
            task_id: task.id,
            category: "external",
            description: "Blocked",
            owner_id: ids.manager,
            blocking_task_id: task.id,
          }),
        );
        assert.equal(
          (await db.query("select count(*)::int as count from public.blockers"))
            .rows[0].count,
          0,
        );
        const blocker = await mutate(ids.member, "raise_blocker", {
          task_id: task.id,
          category: "external",
          description: "Provider dependency",
          owner_id: ids.manager,
        });
        assert.equal(
          (
            await db.query(
              "select active_blocker_id from public.tasks where id = $1",
              [task.id],
            )
          ).rows[0].active_blocker_id,
          blocker.id,
        );
        await assert.rejects(
          mutate(ids.member, "submit_task", { task_id: task.id }),
          /unblocked/,
        );
        await mutate(ids.manager, "clear_blocker", { blocker_id: blocker.id });
        assert.equal(
          (
            await db.query("select status from public.tasks where id = $1", [
              task.id,
            ])
          ).rows[0].status,
          "in_progress",
        );
      },
    );
    await t.test(
      "submission, return, acceptance enforce review workflow",
      async () => {
        await mutate(ids.member, "submit_task", {
          task_id: task.id,
          notes: "Review please",
          deliverable_url: "https://example.com/work",
        });
        await assert.rejects(
          mutate(ids.manager, "return_task", { task_id: task.id, reason: "" }),
          /reason/,
        );
        await mutate(ids.manager, "return_task", {
          task_id: task.id,
          reason: "Add coverage",
        });
        await mutate(ids.member, "submit_task", { task_id: task.id });
        const accepted = await mutate(ids.manager, "accept_task", {
          task_id: task.id,
          actor_id: ids.admin,
        });
        assert.equal(accepted.status, "accepted");
        assert.equal(accepted.accepted_by, ids.manager);
        await assert.rejects(
          mutate(ids.manager, "update_task_status", {
            task_id: task.id,
            status: "in_progress",
          }),
          /cannot be modified/,
        );
      },
    );
    await t.test(
      "cancelling blocked work clears blocker and audits both changes",
      async () => {
        const work = await mutate(ids.member, "create_task", {
          ...taskInput,
          origin: "unplanned",
        });
        const blocker = await mutate(ids.member, "raise_blocker", {
          task_id: work.id,
          category: "decision",
          description: "Need decision",
          owner_id: ids.manager,
        });
        const cancelled = await mutate(ids.member, "update_task_status", {
          task_id: work.id,
          status: "cancelled",
        });
        assert.equal(cancelled.active_blocker_id, null);
        assert.ok(
          (
            await db.query(
              "select cleared_at from public.blockers where id = $1",
              [blocker.id],
            )
          ).rows[0].cleared_at,
        );
      },
    );
    await t.test("leave validation and ledger immutability", async () => {
      await assert.rejects(
        mutate(ids.member, "record_availability", {
          person_id: ids.other,
          from_date: "2026-09-10",
          to_date: "2026-09-12",
        }),
        /own leave/,
      );
      await assert.rejects(
        mutate(ids.member, "record_availability", {
          person_id: ids.member,
          from_date: "2026-09-12",
          to_date: "2026-09-10",
        }),
      );
      await mutate(ids.member, "record_availability", {
        person_id: ids.member,
        from_date: "2026-09-10",
        to_date: "2026-09-12",
        note: "Leave",
      });
      await assert.rejects(
        asUser(ids.admin, (tx) =>
          tx.query("delete from public.ledger_records"),
        ),
        /permission denied/,
      );
    });
  } finally {
    await db.close();
  }
});
