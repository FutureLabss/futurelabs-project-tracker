// Schema-aligned types for the checked-in migrations. Regenerate after schema changes.
import type { UserRole } from "../../entities/person.entity";
import type {
  TaskStatus,
  TaskComplexity,
  TaskOrigin,
} from "../../entities/task.entity";
import type { BlockerCategory } from "../../entities/blocker.entity";
import type {
  LedgerChangeType,
  LedgerSubjectType,
} from "../../entities/ledger-record.entity";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  title: string | null;
};
export type ProjectRow = {
  id: string;
  name: string;
  goal: string;
  start_date: string;
  target_date: string;
  manager_id: string | null;
  state: "active" | "closed";
  created_at: string;
};
export type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  complexity: TaskComplexity;
  origin: TaskOrigin;
  due_date: string;
  submitted_at: string | null;
  accepted_at: string | null;
  accepted_by: string | null;
  active_blocker_id: string | null;
  deliverable_url: string | null;
  submission_notes: string | null;
  created_at: string;
};
export type BlockerRow = {
  id: string;
  task_id: string;
  category: BlockerCategory;
  description: string;
  owner_id: string;
  blocking_task_id: string | null;
  raised_at: string;
  cleared_at: string | null;
  cleared_by: string | null;
};
export type AvailabilityRow = {
  id: string;
  person_id: string;
  from_date: string;
  to_date: string;
  note: string;
};
export type LedgerRow = {
  id: string;
  subject_id: string;
  subject_type: LedgerSubjectType;
  actor_id: string;
  type: LedgerChangeType;
  from_value: string | null;
  to_value: string | null;
  reason: string | null;
  occurred_at: string;
};
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      projects: Table<ProjectRow>;
      tasks: Table<TaskRow>;
      blockers: Table<BlockerRow>;
      availability: Table<AvailabilityRow>;
      ledger_records: Table<LedgerRow>;
    };
    Views: { [_ in never]: never };
    Functions: {
      tracker_mutate: {
        Args: { operation: string; payload: Json };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      task_status: TaskStatus;
      task_complexity: TaskComplexity;
      task_origin: TaskOrigin;
      blocker_category: BlockerCategory;
      ledger_subject_type: LedgerSubjectType;
      ledger_change_type: LedgerChangeType;
      project_state: "active" | "closed";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
