import { URL } from "node:url";
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

const { createClient } = require("@supabase/supabase-js");
const {
  SupabaseTrackerApi,
} = require("../src/api/supabase/supabase-tracker-api.ts");
const { AuthService } = require("../src/services/auth-service.ts");
const { readBackendConfig } = require("../src/lib/supabase/config.ts");
const taskRow = {
  id: "task-id",
  project_id: "project-id",
  title: "Work",
  description: "",
  assignee_id: null,
  status: "not_started",
  complexity: "low",
  origin: "planned",
  due_date: "2026-09-20",
  submitted_at: null,
  accepted_at: null,
  accepted_by: null,
  active_blocker_id: null,
  deliverable_url: null,
  submission_notes: null,
  created_at: "2026-09-01T00:00:00Z",
};
function setup(handler) {
  const requests = [];
  const client = createClient(
    "https://test.supabase.co",
    "sb_publishable_test",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: async (url, options) => {
          const request = {
            url: new URL(String(url)),
            options,
            body: options?.body ? JSON.parse(options.body) : undefined,
          };
          requests.push(request);
          return handler(request, requests.length);
        },
      },
    },
  );
  return {
    api: new SupabaseTrackerApi(client),
    auth: new AuthService(client),
    requests,
  };
}
const json = (value, status = 200) =>
  new globalThis.Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("backend configuration is explicit and rejects incomplete or secret configuration", () => {
  assert.deepEqual(readBackendConfig({}), { backend: "local" });
  assert.throws(() => readBackendConfig({ VITE_DATA_BACKEND: "unknown" }));
  assert.throws(
    () => readBackendConfig({ VITE_DATA_BACKEND: "supabase" }),
    /requires/,
  );
  assert.throws(
    () =>
      readBackendConfig({
        VITE_DATA_BACKEND: "supabase",
        VITE_SUPABASE_URL: "https://test.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_example",
      }),
    /publishable/,
  );
  assert.equal(
    readBackendConfig({
      VITE_DATA_BACKEND: "supabase",
      VITE_SUPABASE_URL: "https://test.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    }).backend,
    "supabase",
  );
});

test("task reads send filters, paginate, and map snake_case fields", async () => {
  const { api, requests } = setup((_request, count) =>
    json(
      count === 1
        ? Array.from({ length: 500 }, (_, id) => ({
            ...taskRow,
            id: String(id),
          }))
        : [{ ...taskRow, id: "last" }],
    ),
  );
  const tasks = await api.getTasks({
    projectId: "project-id",
    assigneeId: "member-id",
    status: ["not_started"],
  });
  assert.equal(tasks.length, 501);
  assert.equal(tasks[0].projectId, "project-id");
  assert.equal(tasks[0].assigneeId, null);
  assert.equal(requests[0].url.searchParams.get("assignee_id"), "eq.member-id");
  assert.equal(requests[0].url.searchParams.get("status"), "in.(not_started)");
  assert.equal(requests[1].url.searchParams.get("offset"), "500");
});

test("mutations use transactional RPC and never send caller-supplied actor IDs", async () => {
  const { api, requests } = setup(() =>
    json({ ...taskRow, status: "submitted" }),
  );
  await api.submitTask(
    "task-id",
    "forged-admin",
    "Ready",
    "https://example.com/work",
  );
  assert.equal(requests[0].url.pathname, "/rest/v1/rpc/tracker_mutate");
  assert.deepEqual(requests[0].body, {
    operation: "submit_task",
    payload: {
      task_id: "task-id",
      notes: "Ready",
      deliverable_url: "https://example.com/work",
    },
  });
});

test("backend failures reject and cloud reset never issues a request", async () => {
  const { api, requests } = setup(() =>
    json({ message: "Not allowed", code: "42501" }, 403),
  );
  await assert.rejects(api.getTasks(), /Not allowed/);
  await assert.rejects(api.acceptTask("task-id", "manager-id"), /Not allowed/);
  const count = requests.length;
  await assert.rejects(api.resetToSeedData(), /disabled/);
  assert.equal(requests.length, count);
});

test("missing details map to null and profile lookup maps the authenticated identity", async () => {
  const missing = setup(() => json(null));
  assert.equal(await missing.api.getTaskById("missing"), null);
  const { auth } = setup(() =>
    json({
      id: "member-id",
      name: "Member",
      email: "member@example.com",
      role: "member",
      title: null,
      avatar_url: null,
    }),
  );
  assert.equal((await auth.getProfile("member-id")).name, "Member");
});
