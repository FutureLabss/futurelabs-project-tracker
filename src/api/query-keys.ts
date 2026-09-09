export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    detail: (id: string) => ["projects", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (filter?: Record<string, unknown>) =>
      ["tasks", filter || {}] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },
  blockers: {
    all: ["blockers"] as const,
    byTask: (taskId?: string) => ["blockers", { taskId }] as const,
  },
  availability: {
    all: ["availability"] as const,
    byPerson: (personId?: string) => ["availability", { personId }] as const,
  },
  persons: {
    all: ["persons"] as const,
  },
  ledger: {
    all: ["ledger"] as const,
    filtered: (filter?: Record<string, unknown>) =>
      ["ledger", filter || {}] as const,
  },
  signals: {
    forDate: (simulatedDate: string) => ["signals", simulatedDate] as const,
  },
};
