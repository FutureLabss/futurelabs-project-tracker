export type LedgerSubjectType = "project" | "task" | "blocker" | "availability";

export type LedgerChangeType =
  | "project_created"
  | "project_closed"
  | "manager_assigned"
  | "task_created"
  | "status_changed"
  | "task_reassigned"
  | "task_redated"
  | "blocker_raised"
  | "blocker_cleared"
  | "task_submitted"
  | "task_accepted"
  | "task_returned"
  | "task_cancelled"
  | "leave_recorded";

export interface LedgerRecord {
  id: string;
  subjectId: string;
  subjectType: LedgerSubjectType;
  actorId: string;
  type: LedgerChangeType;
  fromValue: string | null;
  toValue: string | null;
  reason: string | null; // Mandatory for task_redated and task_returned
  occurredAt: string; // ISO Timestamp
}
