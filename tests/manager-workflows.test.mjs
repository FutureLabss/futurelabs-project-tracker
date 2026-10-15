import { URL } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";

const require = createRequire(import.meta.url);
const compileTs = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
require.extensions[".ts"] = compileTs;

test("manager workflows in the database: create/close project, complexity, reopen", async () => {
  const db = new PGlite();
  const admin = "30000000-0000-4000-8000-000000000001";
  const manager = "30000000-0000-4000-8000-000000000002";
  const otherManager = "30000000-0000-4000-8000-000000000003";
  const member = "30000000-0000-4000-8000-000000000004";
  const session = (id) => id.replace(/^3/, "4");
  const rpc = (id, fn, operation, payload) =>
    db.transaction(async (tx) => {
      await tx.exec("set local role authenticated");
      await tx.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [id, JSON.stringify({ iss: "project-tracker", jti: session(id) })],
      );
      return (
        await tx.query(`select public.${fn}($1,$2::jsonb) as result`, [
          operation,
          JSON.stringify(payload),
        ])
      ).rows[0].result;
    });
  const readAs = (id, sql, params = []) =>
    db.transaction(async (tx) => {
      await tx.exec("set local role authenticated");
      await tx.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [id, JSON.stringify({ iss: "project-tracker", jti: session(id) })],
      );
      return (await tx.query(sql, params)).rows;
    });
  const manage = (operation, payload, id = manager) =>
    rpc(id, "tracker_manager_mutate", operation, payload);
  const mutate = (operation, payload, id = manager) =>
    rpc(id, "tracker_mutate", operation, payload);
  const ledger = async (subjectId, type) =>
    (
      await db.query(
        "select actor_id, from_value, to_value, reason from ledger_records where subject_id=$1 and type=$2",
        [subjectId, type],
      )
    ).rows;

  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;",
    );
    await db.exec("alter default privileges grant execute on functions to anon, authenticated;");
    const directory = new URL("../supabase/migrations/", import.meta.url);
    for (const file of readdirSync(directory).filter((f) => f.endsWith(".sql")).sort())
      await db.transaction((tx) => tx.exec(readFileSync(new URL(file, directory), "utf8")));
    for (const [id, role] of [
      [admin, "admin"],
      [manager, "manager"],
      [otherManager, "manager"],
      [member, "member"],
    ]) {
      await db.query(
        "insert into profiles(id,name,email,role,status) values($1,$2::text,'test@example.test',$2::text::user_role,'active')",
        [id, role],
      );
      await db.query(
        "insert into tracker_sessions(id,lms_user_id,expires_at) values($1,$2,now()+interval '15 minutes')",
        [session(id), id],
      );
    }

    // FR-20: a manager creates a project and becomes its manager; nobody else can use this path.
    const projectInput = {
      name: "Manager-owned delivery",
      goal: "Ship it",
      start_date: "2026-09-01",
      target_date: "2026-10-31",
      manager_id: otherManager,
    };
    const project = await manage("create_project", projectInput);
    assert.equal(project.manager_id, manager, "caller-supplied manager_id is ignored");
    assert.equal((await ledger(project.id, "project_created")).length, 1);
    assert.equal((await ledger(project.id, "manager_assigned"))[0].actor_id, manager);
    await assert.rejects(manage("create_project", projectInput, admin), /Manager access/);
    await assert.rejects(manage("create_project", projectInput, member), /Manager access/);
    await assert.rejects(
      manage("create_project", { ...projectInput, target_date: "2026-08-01" }),
      /target date/,
    );

    const task = await mutate("create_task", {
      project_id: project.id,
      title: "Build the thing",
      complexity: "mid",
      origin: "planned",
      due_date: "2026-10-01",
      assignee_id: manager,
    });

    // FR-22: the manager runs their project's team, then can assign work to members.
    const memberTaskInput = {
      project_id: project.id,
      title: "Member work",
      complexity: "low",
      origin: "planned",
      due_date: "2026-10-01",
      assignee_id: member,
    };
    await assert.rejects(mutate("create_task", memberTaskInput), /no project access/);
    const access = { project_id: project.id, person_id: member, included: true };
    await assert.rejects(manage("set_project_member", access, otherManager), /project's manager/);
    await assert.rejects(manage("set_project_member", access, admin), /Manager access/);
    await assert.rejects(
      manage("set_project_member", { ...access, person_id: admin }),
      /active member or manager/,
    );
    await manage("set_project_member", access);
    assert.equal((await ledger(project.id, "project_member_added"))[0].actor_id, manager);
    assert.deepEqual(
      (await readAs(manager, "select lms_user_id from project_members where project_id=$1", [project.id])).map(
        (r) => r.lms_user_id,
      ),
      [member],
      "a manager can read their project's team",
    );
    assert.equal(
      (await readAs(otherManager, "select 1 from project_members where project_id=$1", [project.id])).length,
      0,
      "other managers cannot read it",
    );
    const memberTask = await mutate("create_task", { ...memberTaskInput, origin: "unplanned" });
    assert.equal(memberTask.assignee_id, member);
    // SR-04: the database decides the origin, whatever the client sends.
    assert.equal(memberTask.origin, "planned", "a manager assigning someone else is planned work");
    const ownTask = await mutate(
      "create_task",
      { ...memberTaskInput, title: "Member's own task", origin: "planned" },
      member,
    );
    assert.equal(ownTask.origin, "unplanned", "self-assigned work is unplanned");
    await assert.rejects(
      mutate("create_task", { ...memberTaskInput, assignee_id: null, title: "No owner" }, member),
      /not permitted/,
      "members only create work for themselves",
    );

    // FR-12 / FR-13: the assignee reschedules their own work, with a reason.
    await assert.rejects(
      mutate("reschedule_task", { task_id: ownTask.id, due_date: "2026-10-05" }, member),
      /reason is required/,
    );
    const moved = await mutate(
      "reschedule_task",
      { task_id: ownTask.id, due_date: "2026-10-05", reason: "Waiting on design" },
      member,
    );
    assert.equal(moved.due_date, "2026-10-05");
    assert.deepEqual(await ledger(ownTask.id, "task_redated"), [
      { actor_id: member, from_value: "2026-10-01", to_value: "2026-10-05", reason: "Waiting on design" },
    ]);
    await assert.rejects(
      mutate("reschedule_task", { task_id: task.id, due_date: "2026-10-09", reason: "x" }, member),
      /project manager|another member/,
      "members cannot move other people's dates",
    );

    // FR-10: open task titles in the project stay pickable as a blocker's cause.
    const titles = await readAs(member, "select title from public.tracker_project_task_titles($1)", [project.id]);
    assert.deepEqual(titles.map((r) => r.title).sort(), ["Build the thing", "Member work", "Member's own task"].sort());
    assert.equal(
      (await readAs(otherManager, "select 1 from public.tracker_project_task_titles($1)", [project.id])).length,
      0,
      "no titles from projects you cannot access",
    );
    await assert.rejects(manage("set_project_member", { ...access, included: false }), /Reassign open tasks/);

    // FR-26: complexity change is audited and limited to the project's manager.
    const changed = await manage("change_complexity", { task_id: task.id, complexity: "high", reason: "Scope grew" });
    assert.equal(changed.complexity, "high");
    assert.deepEqual(await ledger(task.id, "complexity_changed"), [
      { actor_id: manager, from_value: "mid", to_value: "high", reason: "Scope grew" },
    ]);
    await assert.rejects(
      manage("change_complexity", { task_id: task.id, complexity: "high" }),
      /already has this complexity/,
    );
    await assert.rejects(
      manage("change_complexity", { task_id: task.id, complexity: "low" }, otherManager),
      /project's manager/,
    );
    await assert.rejects(
      manage("change_complexity", { task_id: task.id, complexity: "low" }, admin),
      /Manager access/,
    );

    // FR-30 / SR-07: only accepted work reopens, with a reason, recorded as reopened.
    await assert.rejects(manage("reopen_task", { task_id: task.id, reason: "x" }), /Only accepted work/);
    await mutate("submit_task", { task_id: task.id, notes: "Done" });
    await mutate("accept_task", { task_id: task.id });
    await assert.rejects(manage("reopen_task", { task_id: task.id }), /reason is required/);
    await assert.rejects(
      manage("reopen_task", { task_id: task.id, reason: "Bug found" }, otherManager),
      /project's manager/,
    );
    const reopened = await manage("reopen_task", { task_id: task.id, reason: "Bug found" });
    assert.equal(reopened.status, "in_progress");
    assert.equal(reopened.accepted_at, null);
    assert.equal(reopened.accepted_by, null);
    assert.deepEqual(await ledger(task.id, "task_reopened"), [
      { actor_id: manager, from_value: "accepted", to_value: "in_progress", reason: "Bug found" },
    ]);
    await assert.rejects(
      manage("change_complexity", { task_id: task.id, complexity: "low" }, member),
      /Manager access/,
    );

    // FR-21: closing needs all work finished and only the project's manager may do it.
    await assert.rejects(manage("close_project", { project_id: project.id }), /open tasks/);
    await mutate("update_task_status", { task_id: task.id, status: "cancelled" });
    await mutate("update_task_status", { task_id: memberTask.id, status: "cancelled" });
    await mutate("update_task_status", { task_id: ownTask.id, status: "cancelled" });
    await manage("set_project_member", { ...access, included: false });
    assert.equal((await ledger(project.id, "project_member_removed")).length, 1);
    await assert.rejects(manage("close_project", { project_id: project.id }, otherManager), /project's manager/);
    const closed = await manage("close_project", { project_id: project.id });
    assert.equal(closed.state, "closed");
    assert.equal((await ledger(project.id, "project_closed"))[0].actor_id, manager);
    await assert.rejects(manage("close_project", { project_id: project.id }), /active project/);
  } finally {
    await db.close();
  }
});

test("manager workflows in the local demo adapter mirror the database rules", async () => {
  const { MockLocalStorageApi } = require("../src/api/mock/local-storage-adapter.ts");
  const { createTrackerServices } = require("../src/services/create-tracker-services.ts");
  const { createTrackerTestValues } = require("./fixtures/tracker-storage.ts");
  const values = createTrackerTestValues();
  const api = new MockLocalStorageApi({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  });
  const { projectService, taskService, reportingService } = createTrackerServices(api);

  const projectInput = { name: "Demo project", goal: "Demo", startDate: "2026-09-01", targetDate: "2026-10-01" };
  const project = await projectService.createManagedProject({ ...projectInput, actorId: "p-david" });
  assert.equal(project.managerId, "p-david");
  await assert.rejects(projectService.createManagedProject({ ...projectInput, actorId: "p-sarah" }), /Manager access/);
  await assert.rejects(projectService.createManagedProject({ ...projectInput, actorId: "p-alex" }), /Manager access/);

  // task-1 belongs to proj-iam, managed by p-david.
  const changed = await taskService.changeTaskComplexity("task-1", "high", "p-david", "Scope grew");
  assert.equal(changed.complexity, "high");
  await assert.rejects(taskService.changeTaskComplexity("task-1", "low", "p-alex"), /Manager access/);
  await assert.rejects(taskService.changeTaskComplexity("task-1", "high", "p-david"), /already has this complexity/);

  await assert.rejects(taskService.reopenTask("task-1", "p-david", "Bug"), /Only accepted work/);
  // Only the assignee (p-alex) starts, submits or blocks their own work.
  await assert.rejects(taskService.submitTask("task-1", "p-sarah", "Admin"), /Only the task's assignee/);
  await assert.rejects(taskService.submitTask("task-1", "p-david", "Manager"), /Only the task's assignee/);
  await assert.rejects(taskService.updateTaskStatus("task-1", "in_progress", "p-sarah"), /Only the task's assignee/);
  await taskService.submitTask("task-1", "p-alex", "Done");
  await taskService.acceptTask("task-1", "p-david");
  await assert.rejects(taskService.reopenTask("task-1", "p-david", "  "), /reason is required/);
  const reopened = await taskService.reopenTask("task-1", "p-david", "Bug found");
  assert.equal(reopened.status, "in_progress");
  assert.equal(reopened.acceptedAt, null);

  const events = await reportingService.getLedger({ subjectId: "task-1" });
  assert.ok(events.some((e) => e.type === "complexity_changed" && e.fromValue === "mid" && e.toValue === "high"));
  assert.ok(events.some((e) => e.type === "task_reopened" && e.reason === "Bug found"));

  // FR-22 in the demo adapter
  await assert.rejects(projectService.setManagedProjectMember(project.id, "p-alex", true, "p-sarah"), /Manager access/);
  await assert.rejects(
    projectService.setManagedProjectMember(project.id, "p-sarah", true, "p-david"),
    /active member or manager/,
  );
  const isMember = async () =>
    (await projectService.getProjectMembers()).some((m) => m.projectId === project.id && m.personId === "p-alex");
  await projectService.setManagedProjectMember(project.id, "p-alex", true, "p-david");
  assert.equal(await isMember(), true);
  await projectService.setManagedProjectMember(project.id, "p-alex", false, "p-david");
  assert.equal(await isMember(), false);

  await assert.rejects(projectService.closeManagedProject("proj-iam", "p-david"), /open tasks/);
  const closed = await projectService.closeManagedProject(project.id, "p-david");
  assert.equal(closed.state, "closed");
  await assert.rejects(projectService.closeManagedProject(project.id, "p-david"), /active project/);
});

test("member rules in the local demo adapter: own tasks, origin, reschedule (FR-05/12, SR-04)", async () => {
  const { MockLocalStorageApi } = require("../src/api/mock/local-storage-adapter.ts");
  const { createTrackerServices } = require("../src/services/create-tracker-services.ts");
  const { createTrackerTestValues } = require("./fixtures/tracker-storage.ts");
  const values = createTrackerTestValues();
  const { taskService } = createTrackerServices(
    new MockLocalStorageApi({ getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }),
  );
  const base = { projectId: "proj-iam", title: "Mine", description: "", complexity: "low", dueDate: "2026-09-20" };

  const own = await taskService.createTask({ ...base, assigneeId: "p-alex", origin: "planned", actorId: "p-alex" });
  assert.equal(own.origin, "unplanned", "self-assigned is unplanned whatever the client sends");
  const assigned = await taskService.createTask({ ...base, assigneeId: "p-alex", origin: "unplanned", actorId: "p-david" });
  assert.equal(assigned.origin, "planned", "assigned by the manager is planned");
  await assert.rejects(
    taskService.createTask({ ...base, assigneeId: "p-maya", origin: "unplanned", actorId: "p-alex" }),
    /not permitted/,
  );

  const moved = await taskService.rescheduleTask(own.id, "2026-09-25", "Waiting on design", "p-alex");
  assert.equal(moved.dueDate, "2026-09-25");
  await assert.rejects(taskService.rescheduleTask(own.id, "2026-09-26", "x", "p-maya"), /project manager/);
  const titles = await taskService.getProjectTaskTitles("proj-iam");
  assert.ok(titles.some((t) => t.title === "Mine") && titles.every((t) => Object.keys(t).length === 2));
});
