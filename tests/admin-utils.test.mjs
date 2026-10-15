import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, filename) => {
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

const {
  eligiblePeople,
  computeDateRange,
  getPreviousPeriod,
  calculatePeriodAnalytics,
} = require("../src/components/horizons/admin/admin-utils.ts");

test("task owners include every active person with project access", () => {
  const data = {
    projects: [{ id: "project-1", managerId: "manager" }],
    members: [
      { projectId: "project-1", personId: "member" },
      { projectId: "project-1", personId: "inactive-member" },
      { projectId: "other-project", personId: "outsider" },
    ],
    people: [
      { id: "admin", role: "admin", status: "active" },
      { id: "manager", role: "manager", status: "active" },
      { id: "member", role: "member", status: "active" },
      { id: "inactive-member", role: "member", status: "inactive" },
      { id: "outsider", role: "member", status: "active" },
    ],
  };

  assert.deepEqual(
    eligiblePeople(data, "project-1").map((person) => person.id),
    ["admin", "manager", "member"],
  );
  assert.deepEqual(eligiblePeople(data, "missing-project"), []);
});

test("date range computation validates bounds and caps at reporting date", () => {
  const reportingDate = "2026-09-25";

  // 7d preset
  const range7d = computeDateRange("7d", reportingDate);
  assert.equal(range7d.endDate, reportingDate);
  assert.equal(range7d.startDate, "2026-09-18");

  // 30d preset
  const range30d = computeDateRange("30d", reportingDate);
  assert.equal(range30d.endDate, reportingDate);
  assert.equal(range30d.startDate, "2026-08-26");

  // Custom range with future end date must be clamped to reportingDate
  const customFuture = computeDateRange("custom", reportingDate, {
    startDate: "2026-09-01",
    endDate: "2026-10-15",
  });
  assert.equal(customFuture.endDate, reportingDate);
  assert.equal(customFuture.startDate, "2026-09-01");

  // Custom range with inverted dates (startDate > endDate) must be clamped
  const customInverted = computeDateRange("custom", reportingDate, {
    startDate: "2026-09-28",
    endDate: "2026-09-20",
  });
  assert.equal(customInverted.endDate, "2026-09-20");
  assert.equal(customInverted.startDate, "2026-09-20");
});

test("previous period calculation creates an equal-length non-overlapping prior window", () => {
  const current = { startDate: "2026-09-11", endDate: "2026-09-20" }; // 10 days
  const prev = getPreviousPeriod(current);

  assert.equal(prev.endDate, "2026-09-10");
  assert.equal(prev.startDate, "2026-09-01"); // 10 days
});

test("period analytics calculates throughput, rework rate, slips, and trends", () => {
  const data = {
    projects: [
      { id: "proj-1", name: "Alpha", managerId: "mgr-1", state: "active" },
    ],
    people: [
      { id: "mgr-1", name: "Manager One", role: "manager", status: "active" },
      { id: "dev-1", name: "Dev One", role: "member", status: "active" },
    ],
    members: [],
    tasks: [
      {
        id: "t-1",
        title: "Alpha Task 1",
        projectId: "proj-1",
        assigneeId: "dev-1",
        status: "accepted",
        complexity: "mid", // weight 2
        origin: "planned",
        acceptedAt: "2026-09-15T10:00:00Z",
      },
      {
        id: "t-2",
        title: "Alpha Task 2",
        projectId: "proj-1",
        assigneeId: "dev-1",
        status: "accepted",
        complexity: "high", // weight 3
        origin: "unplanned",
        acceptedAt: "2026-09-18T10:00:00Z",
      },
      {
        id: "t-3",
        title: "Alpha Task 3 (Prior Period)",
        projectId: "proj-1",
        assigneeId: "dev-1",
        status: "accepted",
        complexity: "low", // weight 1
        origin: "planned",
        acceptedAt: "2026-09-05T10:00:00Z",
      },
    ],
    ledger: [
      {
        id: "l-1",
        type: "task_submitted",
        subjectType: "task",
        subjectId: "t-1",
        actorId: "dev-1",
        occurredAt: "2026-09-14T09:00:00Z",
      },
      {
        id: "l-2",
        type: "task_returned",
        subjectType: "task",
        subjectId: "t-1",
        actorId: "mgr-1",
        occurredAt: "2026-09-14T11:00:00Z",
      },
      {
        id: "l-3",
        type: "task_submitted",
        subjectType: "task",
        subjectId: "t-1",
        actorId: "dev-1",
        occurredAt: "2026-09-15T09:00:00Z",
      },
      {
        id: "l-4",
        type: "task_redated",
        subjectType: "task",
        subjectId: "t-1",
        actorId: "mgr-1",
        occurredAt: "2026-09-12T08:00:00Z",
      },
    ],
    blockers: [],
    availability: [],
    signals: {
      orgMetrics: {},
      projectSummaries: [],
      memberSummaries: {},
      attentionItems: [],
      blockerAnalytics: [],
    },
  };

  const currentRange = { startDate: "2026-09-11", endDate: "2026-09-20" };
  const analytics = calculatePeriodAnalytics(data, currentRange);

  // Current window: 2 accepted tasks (weights 2 + 3 = 5)
  assert.equal(analytics.current.acceptedCount, 2);
  assert.equal(analytics.current.acceptedWeight, 5);
  // Submissions in window: l-1, l-3 = 2. Returns in window: l-2 = 1. Rework rate: 1/2 = 50%
  assert.equal(analytics.current.totalSubmissions, 2);
  assert.equal(analytics.current.totalReturns, 1);
  assert.equal(analytics.current.reworkRatePercent, 50);
  // Slips in window: l-4 = 1
  assert.equal(analytics.current.dateChanges, 1);

  // Previous window (2026-09-01 to 2026-09-10): 1 accepted task (t-3, weight 1)
  assert.equal(analytics.previous.acceptedCount, 1);
  assert.equal(analytics.previous.acceptedWeight, 1);

  // Trend deltas:
  assert.equal(analytics.trends.acceptedDelta, 1); // 2 - 1
  assert.equal(analytics.trends.weightDelta, 4); // 5 - 1
  assert.equal(analytics.trends.reworkRateDelta, 50); // 50% - 0%

  // Project breakdown includes project summary
  assert.equal(analytics.projectBreakdown.length, 1);
  assert.equal(analytics.projectBreakdown[0].projectName, "Alpha");
  assert.equal(analytics.projectBreakdown[0].acceptedCount, 2);

  // Person breakdown includes team member summary
  const devSummary = analytics.personBreakdown.find((p) => p.personId === "dev-1");
  assert.ok(devSummary);
  assert.equal(devSummary.acceptedCount, 2);
  assert.equal(devSummary.returnsCount, 1);
});

