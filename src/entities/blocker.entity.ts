export type BlockerCategory =
  "person" | "external" | "decision" | "unclear_requirement";

export interface Blocker {
  id: string;
  taskId: string;
  category: BlockerCategory;
  description: string;
  ownerId: string; // Person responsible for clearing the blocker
  blockingTaskId?: string; // Optional task dependency reference
  raisedAt: string; // ISO Timestamp
  clearedAt: string | null; // ISO Timestamp
  clearedBy: string | null;
}
