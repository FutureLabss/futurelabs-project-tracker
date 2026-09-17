import { STORAGE_KEYS } from "../../src/api/mock/storage-keys";

export function createTrackerTestValues() {
  return new Map<string, string>([
    [
      STORAGE_KEYS.PERSONS,
      JSON.stringify([
        {
          id: "p-alex",
          name: "Alex",
          email: "alex@example.test",
          role: "member",
        },
        {
          id: "p-maya",
          name: "Maya",
          email: "maya@example.test",
          role: "member",
        },
        {
          id: "p-david",
          name: "David",
          email: "david@example.test",
          role: "manager",
        },
        {
          id: "p-sarah",
          name: "Sarah",
          email: "sarah@example.test",
          role: "admin",
        },
      ]),
    ],
    [
      STORAGE_KEYS.PROJECTS,
      JSON.stringify([
        {
          id: "proj-iam",
          name: "Test project",
          goal: "Test the tracker",
          startDate: "2026-08-01",
          targetDate: "2026-10-01",
          managerId: "p-david",
          state: "active",
          createdAt: "2026-08-01T09:00:00Z",
        },
      ]),
    ],
    [
      STORAGE_KEYS.TASKS,
      JSON.stringify([
        {
          id: "task-1",
          projectId: "proj-iam",
          title: "Test task",
          description: "",
          assigneeId: "p-alex",
          status: "in_progress",
          complexity: "mid",
          origin: "planned",
          dueDate: "2026-09-10",
          submittedAt: null,
          acceptedAt: null,
          acceptedBy: null,
          activeBlockerId: null,
          createdAt: "2026-08-12T09:00:00Z",
        },
        ...["accepted-1", "accepted-2"].map((id) => ({
          id,
          projectId: "proj-iam",
          title: id,
          description: "",
          assigneeId: "p-alex",
          status: "accepted",
          complexity: "low",
          origin: "planned",
          dueDate: "2026-08-20",
          submittedAt: "2026-08-19T09:00:00Z",
          acceptedAt: "2026-08-20T09:00:00Z",
          acceptedBy: "p-david",
          activeBlockerId: null,
          createdAt: "2026-08-10T09:00:00Z",
        })),
      ]),
    ],
    [STORAGE_KEYS.BLOCKERS, "[]"],
    [STORAGE_KEYS.AVAILABILITIES, "[]"],
    [STORAGE_KEYS.LEDGER, "[]"],
    [
      STORAGE_KEYS.PROJECT_MEMBERS,
      JSON.stringify([{ projectId: "proj-iam", personId: "p-alex" }]),
    ],
  ]);
}
