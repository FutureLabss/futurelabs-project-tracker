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
