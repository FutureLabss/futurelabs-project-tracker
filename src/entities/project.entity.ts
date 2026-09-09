export type ProjectState = "active" | "closed";
export type RagStatus = "green" | "amber" | "red";

export interface Project {
  id: string;
  name: string;
  goal: string;
  startDate: string; // ISO YYYY-MM-DD
  targetDate: string; // ISO YYYY-MM-DD
  managerId: string | null; // Nullable -> Unmanaged project state
  state: ProjectState;
  createdAt: string; // ISO Timestamp
}
