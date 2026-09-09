import type {
  ProfileRow,
  ProjectRow,
  TaskRow,
  BlockerRow,
  AvailabilityRow,
  LedgerRow,
} from "../../lib/supabase/database-rows";
import type { Person } from "../../entities/person.entity";
import type { Project } from "../../entities/project.entity";
import type { Task } from "../../entities/task.entity";
import type { Blocker } from "../../entities/blocker.entity";
import type { Availability } from "../../entities/availability.entity";
import type { LedgerRecord } from "../../entities/ledger-record.entity";
export const mapProfile = (r: ProfileRow): Person => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  avatarUrl: r.avatar_url ?? undefined,
  title: r.title ?? undefined,
});
export const mapProject = (r: ProjectRow): Project => ({
  id: r.id,
  name: r.name,
  goal: r.goal,
  startDate: r.start_date,
  targetDate: r.target_date,
  managerId: r.manager_id,
  state: r.state,
  createdAt: r.created_at,
});
export const mapTask = (r: TaskRow): Task => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  description: r.description,
  assigneeId: r.assignee_id,
  status: r.status,
  complexity: r.complexity,
  origin: r.origin,
  dueDate: r.due_date,
  submittedAt: r.submitted_at,
  acceptedAt: r.accepted_at,
  acceptedBy: r.accepted_by,
  activeBlockerId: r.active_blocker_id,
  deliverableUrl: r.deliverable_url,
  submissionNotes: r.submission_notes,
  createdAt: r.created_at,
});
export const mapBlocker = (r: BlockerRow): Blocker => ({
  id: r.id,
  taskId: r.task_id,
  category: r.category,
  description: r.description,
  ownerId: r.owner_id,
  blockingTaskId: r.blocking_task_id ?? undefined,
  raisedAt: r.raised_at,
  clearedAt: r.cleared_at,
  clearedBy: r.cleared_by,
});
export const mapAvailability = (r: AvailabilityRow): Availability => ({
  id: r.id,
  personId: r.person_id,
  fromDate: r.from_date,
  toDate: r.to_date,
  note: r.note,
});
export const mapLedger = (r: LedgerRow): LedgerRecord => ({
  id: r.id,
  subjectId: r.subject_id,
  subjectType: r.subject_type,
  actorId: r.actor_id,
  type: r.type,
  fromValue: r.from_value,
  toValue: r.to_value,
  reason: r.reason,
  occurredAt: r.occurred_at,
});
