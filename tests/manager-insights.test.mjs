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

const insights = require("../src/domain/calculations/manager-insights.ts");
const { calculateOperationalSignals } = require("../src/domain/calculations/derived-signals.ts");

// 2026-09-01 is a Tuesday.
const DATE = "2026-09-01";
const task = (id, extra = {}) => ({
  id,
  projectId: "proj-a",
  title: id,
  description: "",
  assigneeId: "p-bea",
  status: "in_progress",
  complexity: "mid",
  origin: "planned",
  dueDate: "2026-09-30",
  submittedAt: null,
  acceptedAt: null,
  acceptedBy: null,
  activeBlockerId: null,
  createdAt: "2026-08-20T09:00:00Z",
  ...extra,
});
const projects = [
  { id: "proj-a", name: "A", goal: "", startDate: "2026-08-01", targetDate: "2026-10-31", managerId: "p-mgr", state: "active", createdAt: "2026-08-01T00:00:00Z" },
  { id: "proj-b", name: "B", goal: "", startDate: "2026-08-01", targetDate: "2026-10-31", managerId: "p-other", state: "active", createdAt: "2026-08-01T00:00:00Z" },
];
const people = [
  { id: "p-mgr", name: "Morgan", email: "", role: "manager" },
  { id: "p-zed", name: "Zed", email: "", role: "member" },
  { id: "p-bea", name: "Bea", email: "", role: "member" },
];
const event = (id, subjectId, type, occurredAt, extra = {}) => ({
  id, subjectId, subjectType: "task", actorId: "p-mgr", type, fromValue: null, toValue: null, reason: null, occurredAt, ...extra,
});

test("scope keeps only the manager's projects and their tasks, blockers and changes", () => {
  const tasks = [task("t-a"), task("t-b", { projectId: "proj-b" })];
  const blockers = [
    { id: "b-a", taskId: "t-a", category: "external", description: "x", ownerId: "p-zed", raisedAt: "2026-08-25T09:00:00Z", clearedAt: null, clearedBy: null },
    { id: "b-b", taskId: "t-b", category: "external", description: "x", ownerId: "p-zed", raisedAt: "2026-08-25T09:00:00Z", clearedAt: null, clearedBy: null },
  ];
  const ledger = [
    event("l1", "t-a", "status_changed", "2026-08-21T09:00:00Z"),
    event("l2", "t-b", "status_changed", "2026-08-21T09:00:00Z"),
    { ...event("l3", "b-a", "blocker_raised", "2026-08-25T09:00:00Z"), subjectType: "blocker" },
    { ...event("l4", "proj-a", "project_created", "2026-08-01T09:00:00Z"), subjectType: "project" },
  ];
  const scope = insights.scopeToManagedProjects("p-mgr", { projects, tasks, blockers, ledger });
  assert.deepEqual(scope.projects.map((p) => p.id), ["proj-a"]);
  assert.deepEqual(scope.tasks.map((t) => t.id), ["t-a"]);
  assert.deepEqual(scope.blockers.map((b) => b.id), ["b-a"]);
  assert.deepEqual(scope.ledger.map((r) => r.id), ["l1", "l3", "l4"]);
  assert.equal(insights.projectIdOfRecord(ledger[2], scope), "proj-a");
});

test("open blockers are ordered by working days open and expose owner and cause", () => {
  const tasks = [task("t1"), task("t2"), task("t-cause")];
  const blockers = [
    { id: "b-new", taskId: "t1", category: "decision", description: "x", ownerId: "p-zed", raisedAt: "2026-08-31T09:00:00Z", clearedAt: null, clearedBy: null },
    { id: "b-old", taskId: "t2", category: "person", description: "x", ownerId: "p-bea", blockingTaskId: "t-cause", raisedAt: "2026-08-24T09:00:00Z", clearedAt: null, clearedBy: null },
    { id: "b-done", taskId: "t1", category: "person", description: "x", ownerId: "p-bea", raisedAt: "2026-08-01T09:00:00Z", clearedAt: "2026-08-02T09:00:00Z", clearedBy: "p-bea" },
  ];
  const rows = insights.openBlockersByAge(blockers, tasks, DATE);
  assert.deepEqual(rows.map((r) => r.blocker.id), ["b-old", "b-new"]);
  assert.equal(rows[0].daysOpen, 6); // Mon 24 Aug .. Mon 31 Aug, weekend excluded
  assert.equal(rows[0].causingTask.id, "t-cause");
  assert.equal(rows[1].causingTask, undefined);
});

test("due-soon list matches the member's DUE SOON flag exactly (SR-19)", () => {
  const tasks = [
    task("due-today", { status: "not_started", dueDate: "2026-09-01" }),
    task("due-thu", { status: "not_started", dueDate: "2026-09-03" }),
    task("due-next-week", { status: "not_started", dueDate: "2026-09-08" }),
    task("overdue", { status: "not_started", dueDate: "2026-08-28" }),
    task("started", { status: "in_progress", dueDate: "2026-09-02" }),
  ];
  const rows = insights.notStartedDueSoon(tasks, DATE);
  assert.deepEqual(rows.map((r) => [r.task.id, r.workingDaysRemaining]), [["due-today", 0], ["due-thu", 2]]);

  const signals = calculateOperationalSignals(people, projects, tasks, [], [], [], DATE);
  const memberFlagged = signals.memberSummaries["p-bea"].imminentTasks.map((t) => t.id).sort();
  assert.deepEqual(rows.map((r) => r.task.id).sort(), memberFlagged);
});

test("workload is weighted, excludes finished work and is ordered by name, not load", () => {
  const tasks = [
    task("z1", { assigneeId: "p-zed", complexity: "high" }),
    task("z2", { assigneeId: "p-zed", complexity: "high" }),
    task("b1", { assigneeId: "p-bea", complexity: "low" }),
    task("b-done", { assigneeId: "p-bea", status: "accepted", complexity: "high" }),
    task("b-cancel", { assigneeId: "p-bea", status: "cancelled", complexity: "high" }),
    task("none", { assigneeId: null, complexity: "mid" }),
  ];
  assert.deepEqual(
    insights.openWorkByPerson(tasks, people).map((r) => [r.name, r.openTasks, r.openWeight]),
    [["Bea", 1, 1], ["Zed", 2, 6], ["Unassigned", 1, 2]],
  );
});

test("forecast and slips: remaining weight, recent acceptance rate, later-only re-dates", () => {
  const tasks = [
    task("open-high", { complexity: "high" }),
    task("open-low", { complexity: "low" }),
    task("accepted-recent", { status: "accepted", complexity: "high", acceptedAt: "2026-08-20T09:00:00Z" }),
    task("accepted-recent-2", { status: "accepted", complexity: "high", acceptedAt: "2026-08-27T09:00:00Z" }),
    task("accepted-old", { status: "accepted", complexity: "high", acceptedAt: "2026-06-01T09:00:00Z" }),
  ];
  const ledger = [
    event("s1", "open-high", "task_redated", "2026-08-21T09:00:00Z", { fromValue: "2026-09-10", toValue: "2026-09-20", reason: "r" }),
    event("s2", "open-high", "task_redated", "2026-08-22T09:00:00Z", { fromValue: "2026-09-20", toValue: "2026-09-15", reason: "r" }),
    event("s3", "open-low", "task_redated", "2026-08-23T09:00:00Z", { fromValue: "2026-09-01", toValue: "2026-09-05", reason: "r" }),
  ];
  const [row] = insights.projectForecasts([projects[0]], tasks, ledger, DATE, 4);
  assert.equal(row.remainingWeight, 4);
  assert.equal(row.acceptedWeightRecent, 6);
  assert.equal(row.weeklyAcceptanceRate, 1.5);
  assert.ok(Math.abs(row.weeksToFinish - 4 / 1.5) < 1e-9);
  assert.equal(row.slipCount, 2, "moving a date earlier is not a slip");
});

test("unplanned share and rework share respect the chosen period", () => {
  const tasks = [
    task("u1", { origin: "unplanned", complexity: "high", createdAt: "2026-08-10T09:00:00Z" }),
    task("p1", { origin: "planned", complexity: "low", createdAt: "2026-08-11T09:00:00Z" }),
    task("p-outside", { origin: "planned", complexity: "high", createdAt: "2026-07-01T09:00:00Z" }),
  ];
  const unplanned = insights.unplannedShare(tasks, "2026-08-01", "2026-08-31");
  assert.deepEqual([unplanned.part, unplanned.total, unplanned.percent], [3, 4, 75]);
  assert.deepEqual([unplanned.count.part, unplanned.count.total], [1, 2]);
  assert.equal(insights.unplannedShare(tasks, "2026-09-01", "2026-09-30").percent, null);

  const ledger = [
    event("e1", "u1", "task_submitted", "2026-08-12T09:00:00Z"),
    event("e2", "u1", "task_returned", "2026-08-13T09:00:00Z", { reason: "r" }),
    event("e3", "p1", "task_submitted", "2026-08-14T09:00:00Z"),
    event("e4", "p1", "task_accepted", "2026-08-15T09:00:00Z"),
    event("e5", "p-outside", "task_reopened", "2026-08-16T09:00:00Z", { reason: "r" }),
  ];
  const rework = insights.reworkShare(ledger, new Set(tasks.map((t) => t.id)), "2026-08-01", "2026-08-31");
  assert.deepEqual([rework.part, rework.total, rework.percent], [1, 2, 50]);
});

test("inactive tasks: no change for the threshold, leave excluded, finished work ignored (FR-39)", () => {
  const tasks = [
    task("quiet", { createdAt: "2026-08-17T09:00:00Z" }),
    task("busy", { createdAt: "2026-08-17T09:00:00Z" }),
    task("on-leave", { createdAt: "2026-08-24T09:00:00Z", assigneeId: "p-zed" }),
    task("done", { status: "accepted", createdAt: "2026-08-01T09:00:00Z", acceptedAt: "2026-08-02T09:00:00Z" }),
  ];
  const ledger = [event("x", "busy", "status_changed", "2026-08-31T09:00:00Z")];
  const leave = [{ id: "a", personId: "p-zed", fromDate: "2026-08-24", toDate: "2026-08-28", note: "" }];
  const rows = insights.staleTasks(tasks, ledger, leave, DATE);
  assert.deepEqual(rows.map((r) => [r.task.id, r.inactiveWorkingDays]), [["quiet", 11]]);
});

test("attention list adds fresh blockers, due-soon and inactive work, silent overruns first (FR-31/32)", () => {
  const scope = { projects: [projects[0]], tasks: [], blockers: [], ledger: [] };
  const t = (id, extra) => task(id, extra);
  const signalItems = [
    { id: "s-other", taskId: "x", projectId: "proj-b", signalType: "overdue", severity: "warning", headline: "", details: "", projectName: "B", assigneeId: null, assigneeName: "" },
    { id: "s-aging", taskId: "aging", projectId: "proj-a", signalType: "aging_wip", severity: "warning", headline: "", details: "", projectName: "A", assigneeId: null, assigneeName: "", daysStalled: 2 },
    { id: "s-silent", taskId: "silent", projectId: "proj-a", signalType: "silent_overrun", severity: "critical", headline: "", details: "", projectName: "A", assigneeId: null, assigneeName: "", daysStalled: 1 },
  ];
  const blockedTask = t("blocked-1", { status: "blocked" });
  const list = insights.managerAttentionList(signalItems, scope, {
    blockers: [{ blocker: { id: "b1", ownerId: "p-zed" }, task: blockedTask, daysOpen: 1 }],
    dueSoon: [{ task: t("soon", { status: "not_started" }), workingDaysRemaining: 1 }],
    stale: [
      { task: t("silent"), inactiveWorkingDays: 9, lastActivityAt: "2026-08-10T00:00:00Z" },
      { task: t("quiet"), inactiveWorkingDays: 6, lastActivityAt: "2026-08-20T00:00:00Z" },
    ],
    personName: (id) => id ?? "Unassigned",
  });
  assert.equal(list[0].signalType, "silent_overrun", "silent overruns are pinned first");
  assert.ok(!list.some((i) => i.projectId === "proj-b"), "other managers' projects are excluded");
  const types = list.map((i) => `${i.taskId}:${i.signalType}`).sort();
  assert.deepEqual(types, [
    "aging:aging_wip",
    "blocked-1:blocked",
    "quiet:stale_inactivity",
    "silent:silent_overrun",
    "soon:imminent_unstarted",
  ]);
  assert.ok(list.every((i) => i.taskId), "every entry opens a task (FR-33)");
});
