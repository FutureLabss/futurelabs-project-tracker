import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const compileTs = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
require.extensions[".ts"] = compileTs;
const { unattendedTasks, inactiveProjects } = require("../src/domain/calculations/admin-insights.ts");
const { evaluateProjectRag } = require("../src/domain/calculations/project-rag.ts");

// 2026-09-01 is a Tuesday.
const DATE = "2026-09-01";
const task = (id, extra = {}) => ({
  id, projectId: "p", title: id, description: "", assigneeId: "dev", status: "in_progress", complexity: "mid",
  origin: "planned", dueDate: "2026-09-30", submittedAt: null, acceptedAt: null, acceptedBy: null,
  activeBlockerId: null, createdAt: "2026-08-10T09:00:00Z", ...extra,
});
const rec = (id, subjectId, actorId, occurredAt, extra = {}) => ({
  id, subjectId, subjectType: "task", actorId, type: "status_changed", fromValue: null, toValue: null, reason: null, occurredAt, ...extra,
});

test("unattended: blocked or aging work only the assignee has touched (FR-54)", () => {
  const blocker = { id: "b", taskId: "blocked", category: "external", description: "x", ownerId: "ops", raisedAt: "2026-08-24T09:00:00Z", clearedAt: null, clearedBy: null };
  const tasks = [
    task("blocked", { status: "blocked", activeBlockerId: "b" }),
    task("aging"),
    task("aging-but-managed"),
    task("fresh", { createdAt: "2026-08-31T09:00:00Z" }),
    task("not-started", { status: "not_started" }),
  ];
  const ledger = [
    // The assignee keeps updating their own work: still unattended by anyone else.
    rec("a1", "aging", "dev", "2026-08-31T09:00:00Z", { toValue: "in_progress" }),
    rec("a0", "aging", "dev", "2026-08-12T09:00:00Z", { toValue: "in_progress" }),
    rec("m0", "aging-but-managed", "dev", "2026-08-12T09:00:00Z", { toValue: "in_progress" }),
    rec("m1", "aging-but-managed", "mgr", "2026-08-31T09:00:00Z", { type: "task_redated", fromValue: "2026-09-30", toValue: "2026-10-02", reason: "r" }),
    { ...rec("b1", "b", "dev", "2026-08-24T09:00:00Z", { type: "blocker_raised" }), subjectType: "blocker" },
  ];
  const rows = unattendedTasks(tasks, [blocker], ledger, DATE);
  assert.deepEqual(rows.map((r) => [r.task.id, r.reason]), [["blocked", "blocked"]]);
  assert.equal(rows[0].workingDaysUnattended, 16, "since creation: nobody else ever acted");

  // Re-entering in progress resets aging: "aging" is in progress since 31 Aug, so it is not aging.
  assert.ok(!rows.some((r) => r.task.id === "aging"));
  const olderLedger = ledger.filter((l) => l.id !== "a1");
  assert.ok(unattendedTasks(tasks, [blocker], olderLedger, DATE).some((r) => r.task.id === "aging"));
});

test("inactive projects use the same rule as the amber risk rating (FR-55)", () => {
  const project = (id, extra = {}) => ({
    id, name: id, goal: "", startDate: "2026-08-01", targetDate: "2026-12-31", managerId: "mgr", state: "active",
    createdAt: "2026-08-01T09:00:00Z", ...extra,
  });
  const projects = [project("quiet"), project("busy"), project("closed", { state: "closed" })];
  const tasks = [task("q", { projectId: "quiet" }), task("bz", { projectId: "busy" })];
  const ledger = [rec("1", "q", "dev", "2026-08-20T09:00:00Z"), rec("2", "bz", "dev", "2026-08-31T09:00:00Z")];
  const rows = inactiveProjects(projects, tasks, [], ledger, DATE);
  assert.deepEqual(rows.map((r) => [r.project.id, r.workingDaysInactive]), [["quiet", 8]]);
  for (const p of projects.filter((p) => p.state === "active")) {
    const amberForInactivity = evaluateProjectRag(p, tasks, [], ledger, DATE).reasons.some((r) => r.startsWith("No activity"));
    assert.equal(amberForInactivity, rows.some((r) => r.project.id === p.id), `rating and list agree for ${p.id}`);
  }
});
