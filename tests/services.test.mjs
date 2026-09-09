import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

// Compile project TypeScript in memory; no additional test dependency or emitted files.
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
  MockLocalStorageApi,
} = require("../src/api/mock/local-storage-adapter.ts");
const {
  createTrackerServices,
} = require("../src/services/create-tracker-services.ts");
const { TaskService } = require("../src/services/task-service.ts");

function setup() {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  return {
    storage,
    values,
    ...createTrackerServices(new MockLocalStorageApi(storage)),
  };
}

test("services accept an injected backend and propagate its failures", async () => {
  const failure = new Error("Backend unavailable");
  const service = new TaskService({
    getTasks: async (filter) => {
      assert.deepEqual(filter, { assigneeId: "p-alex" });
      throw failure;
    },
  });
  await assert.rejects(
    service.getTasks({ assigneeId: "p-alex" }),
    (error) => error === failure,
  );
});

test("seeded task filters, project lookup, and people share one dataset", async () => {
  const { taskService, projectService, peopleService } = setup();
  const tasks = await taskService.getTasks({
    assigneeId: "p-alex",
    status: ["accepted"],
  });
  assert.equal(tasks.length, 2);
  assert.ok(
    tasks.every(
      (task) => task.assigneeId === "p-alex" && task.status === "accepted",
    ),
  );
  assert.ok(await projectService.getProjectById(tasks[0].projectId));
  assert.ok(
    (await peopleService.getPersons()).some((person) => person.id === "p-alex"),
  );
  assert.equal(await taskService.getTaskById("missing"), null);
});

test("rescheduling requires a reason, persists, and records the change", async () => {
  const { taskService, reportingService, storage } = setup();
  const original = await taskService.getTaskById("task-1");
  await assert.rejects(
    taskService.rescheduleTask("task-1", "2026-10-01", " ", "p-david"),
  );
  assert.equal(
    (await taskService.getTaskById("task-1")).dueDate,
    original.dueDate,
  );
  await taskService.rescheduleTask(
    "task-1",
    "2026-10-01",
    "Dependency delayed",
    "p-david",
  );
  const reloaded = createTrackerServices(new MockLocalStorageApi(storage));
  assert.equal(
    (await reloaded.taskService.getTaskById("task-1")).dueDate,
    "2026-10-01",
  );
  const ledger = await reportingService.getLedger({ subjectId: "task-1" });
  assert.ok(
    ledger.some(
      (row) =>
        row.type === "task_redated" && row.reason === "Dependency delayed",
    ),
  );
});

test("raising and clearing a blocker updates its task", async () => {
  const { blockerService, taskService } = setup();
  const blocker = await blockerService.raiseBlocker({
    taskId: "task-1",
    category: "external",
    description: "Waiting on provider",
    ownerId: "p-david",
    blockingTaskId: null,
    actorId: "p-alex",
  });
  assert.equal(
    (await taskService.getTaskById("task-1")).activeBlockerId,
    blocker.id,
  );
  await blockerService.clearBlocker(blocker.id, "p-david");
  const task = await taskService.getTaskById("task-1");
  assert.equal(task.status, "in_progress");
  assert.equal(task.activeBlockerId, null);
});

test("submitting and accepting work preserves delivery metadata", async () => {
  const { taskService } = setup();
  await taskService.submitTask(
    "task-1",
    "p-alex",
    "Ready for review",
    "https://example.com/delivery",
  );
  const task = await taskService.acceptTask("task-1", "p-david");
  assert.equal(task.status, "accepted");
  assert.equal(task.acceptedBy, "p-david");
  assert.ok(task.acceptedAt);
  assert.equal(task.deliverableUrl, "https://example.com/delivery");
});

test("demo reset restores seed without touching other applications storage", async () => {
  const { taskService, demoService, values } = setup();
  values.set("fl_tracker_tasks", "reference project data");
  await taskService.updateTaskStatus("task-1", "cancelled", "p-alex");
  await demoService.resetToSeedData();
  assert.equal((await taskService.getTaskById("task-1")).status, "in_progress");
  assert.equal(values.get("fl_tracker_tasks"), "reference project data");
});
