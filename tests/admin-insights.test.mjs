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

test("monthly delivery counts acceptances and rework by month, reopened work included (FR-56/59)", () => {
  const { monthlyDelivery } = require("../src/domain/calculations/admin-insights.ts");
  const tasks = [
    task("a", { complexity: "high", status: "in_progress" }), // accepted in July, reopened in August
    task("b", { complexity: "low", status: "accepted", acceptedAt: "2026-08-20T10:00:00Z" }), // no log entry (older data)
  ];
  const ledger = [
    rec("1", "a", "dev", "2026-07-10T10:00:00Z", { type: "task_submitted" }),
    rec("2", "a", "mgr", "2026-07-11T10:00:00Z", { type: "task_accepted" }),
    rec("3", "a", "dev", "2026-08-03T10:00:00Z", { type: "task_submitted" }),
    rec("4", "a", "mgr", "2026-08-04T10:00:00Z", { type: "task_reopened", reason: "bug" }),
    // Another project's task (not in `tasks`) must not be counted.
    rec("5", "elsewhere", "mgr", "2026-07-20T10:00:00Z", { type: "task_accepted" }),
  ];
  const rows = monthlyDelivery(tasks, ledger, DATE, 3);
  assert.deepEqual(rows.map((r) => r.month), ["2026-07", "2026-08", "2026-09"]);
  assert.deepEqual([rows[0].acceptedCount, rows[0].acceptedWeight], [1, 3], "July keeps the reopened task's acceptance");
  assert.deepEqual([rows[1].acceptedCount, rows[1].submissions, rows[1].reworked, rows[1].reworkPercent], [1, 1, 1, 100]);
  assert.equal(rows[2].reworkPercent, null, "no submissions yet in September");
});

test("blockers by category for a period, with the projects they affect (FR-60)", () => {
  const { blockerCategoryReport } = require("../src/domain/calculations/admin-insights.ts");
  const projects = [
    { id: "p1", name: "Payments" },
    { id: "p2", name: "Mobile" },
  ];
  const tasks = [task("t1", { projectId: "p1" }), task("t2", { projectId: "p2" })];
  const b = (id, taskId, category, raisedAt, clearedAt = null) => ({ id, taskId, category, description: "x", ownerId: "o", raisedAt, clearedAt, clearedBy: clearedAt ? "o" : null });
  const blockers = [
    b("1", "t1", "external", "2026-08-10T10:00:00Z"),
    b("2", "t2", "external", "2026-08-12T10:00:00Z", "2026-08-13T10:00:00Z"),
    b("3", "t2", "decision", "2026-06-01T10:00:00Z"),
  ];
  const report = blockerCategoryReport(blockers, tasks, projects, { startDate: "2026-08-01", endDate: "2026-08-31" });
  const external = report.find((r) => r.category === "external");
  assert.deepEqual([external.raisedInPeriod, external.openNow, external.projectNames], [2, 1, ["Mobile", "Payments"]]);
  const decision = report.find((r) => r.category === "decision");
  assert.deepEqual([decision.raisedInPeriod, decision.openNow, decision.projectNames], [0, 1, []]);
  assert.equal(report.length, 4, "every category is listed, even with no blockers");
});
