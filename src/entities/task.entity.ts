export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "submitted"
  | "accepted"
  | "cancelled";

export type TaskComplexity = "low" | "mid" | "high"; // Weights: Low = 1, Mid = 2, High = 3
export type TaskOrigin = "planned" | "unplanned"; // Manager-created vs Self-created ad-hoc

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  status: TaskStatus;
  complexity: TaskComplexity;
  origin: TaskOrigin;
  dueDate: string; // ISO YYYY-MM-DD
  submittedAt: string | null;
  acceptedAt: string | null;
  acceptedBy: string | null;
  activeBlockerId: string | null;
  deliverableUrl?: string | null;
  submissionNotes?: string | null;
  createdAt: string;
}
