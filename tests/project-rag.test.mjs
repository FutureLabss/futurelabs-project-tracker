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
const { evaluateProjectRag } = require("../src/domain/calculations/project-rag.ts");

// 2026-09-01 is a Tuesday.
const DATE = "2026-09-01";
const project = (extra = {}) => ({
  id: "p", name: "P", goal: "", startDate: "2026-08-01", targetDate: "2026-10-31",
  managerId: "mgr", state: "active", createdAt: "2026-08-01T09:00:00Z", ...extra,
});
const task = (id, extra = {}) => ({
  id, projectId: "p", title: id, description: "", assigneeId: "dev", status: "not_started", complexity: "mid",
  origin: "planned", dueDate: "2026-09-30", submittedAt: null, acceptedAt: null, acceptedBy: null,
  activeBlockerId: null, createdAt: "2026-08-31T09:00:00Z", ...extra,
});
const rec = (id, subjectId, type, occurredAt, extra = {}) => ({
  id, subjectId, subjectType: "task", actorId: "dev", type, fromValue: null, toValue: null, reason: null, occurredAt, ...extra,
});
const recent = rec("recent", "t-any", "task_created", "2026-08-31T09:00:00Z");

test("closed projects are not rated", () => {
  const r = evaluateProjectRag(project({ state: "closed", targetDate: "2026-01-01" }), [task("t")], [], [], DATE);
  assert.equal(r.status, "green");
  assert.match(r.reasons[0], /closed/);
});

test("aging in-progress work with no manager action turns a project red", () => {
  const t = task("t-any", { status: "in_progress" });
  const started = rec("s", "t-any", "status_changed", "2026-08-20T09:00:00Z", { toValue: "in_progress" });
  const r = evaluateProjectRag(project(), [t], [], [started], DATE);
  assert.equal(r.status, "red");
  assert.match(r.reasons[0], /in progress for 8 working days \(expected 6 for mid\)/);

  const managerTouched = rec("m", "t-any", "task_redated", "2026-08-27T09:00:00Z", {
    actorId: "mgr", fromValue: "2026-09-30", toValue: "2026-09-29", reason: "r",
  });
  assert.equal(evaluateProjectRag(project(), [t], [], [started, managerTouched], DATE).status, "green");
});

test("a manager action on the blocker counts as attending to a blocked task", () => {
  const t = task("t-any", { status: "blocked", activeBlockerId: "b" });
  const blocker = { id: "b", taskId: "t-any", category: "external", description: "x", ownerId: "dev", raisedAt: "2026-08-24T09:00:00Z", clearedAt: null, clearedBy: null };
  assert.equal(evaluateProjectRag(project(), [t], [blocker], [recent], DATE).status, "red");
  const onBlocker = { ...rec("m", "b", "blocker_raised", "2026-08-26T09:00:00Z", { actorId: "mgr" }), subjectType: "blocker" };
  assert.equal(evaluateProjectRag(project(), [t], [blocker], [recent, onBlocker], DATE).status, "green");
});

test("red projects keep their amber reasons too; earlier re-dates are not slips", () => {
  const overdue = task("late", { dueDate: "2026-08-20" });
  const touched = rec("touched", "late", "status_changed", "2026-08-31T09:00:00Z");
  const r = evaluateProjectRag(project({ targetDate: "2026-08-25" }), [overdue], [], [touched], DATE);
  assert.equal(r.status, "red");
  assert.equal(r.reasons.length, 2);
  assert.match(r.reasons[1], /overdue/);

  const t = task("t-any");
  const earlier = (id) => rec(id, "t-any", "task_redated", "2026-08-31T09:00:00Z", { fromValue: "2026-09-30", toValue: "2026-09-20", reason: "r" });
  assert.equal(evaluateProjectRag(project(), [t], [], [earlier("a"), earlier("b")], DATE).status, "green");
});

test("blocker records count as project activity", () => {
  const t = task("t-any", { createdAt: "2026-08-01T09:00:00Z" });
  const blocker = { id: "b", taskId: "t-any", category: "external", description: "x", ownerId: "dev", raisedAt: "2026-08-31T09:00:00Z", clearedAt: "2026-08-31T10:00:00Z", clearedBy: "dev" };
  const old = rec("o", "t-any", "task_created", "2026-08-01T09:00:00Z");
  assert.equal(evaluateProjectRag(project(), [t], [blocker], [old], DATE).status, "amber");
  const blockerEvent = { ...rec("e", "b", "blocker_cleared", "2026-08-31T10:00:00Z"), subjectType: "blocker" };
  assert.equal(evaluateProjectRag(project(), [t], [blocker], [old, blockerEvent], DATE).status, "green");
});
