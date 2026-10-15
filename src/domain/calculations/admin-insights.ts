import type { Blocker } from "../../entities/blocker.entity";
import type { LedgerRecord } from "../../entities/ledger-record.entity";
import type { Project } from "../../entities/project.entity";
import type { Task } from "../../entities/task.entity";
import { SYSTEM_CONFIG } from "../config/system-thresholds";
import { getWorkingDaysElapsed } from "./working-days";

const latest = (timestamps: string[]): string | null =>
  timestamps.reduce<string | null>((max, t) => (!max || t > max ? t : max), null);

/** Records about a task, including records about its blockers. */
function taskRecords(taskId: string, blockers: Blocker[], ledger: LedgerRecord[]) {
  const blockerIds = new Set(blockers.filter((b) => b.taskId === taskId).map((b) => b.id));
  return ledger.filter((l) => l.subjectId === taskId || blockerIds.has(l.subjectId));
}

export interface UnattendedTaskRow {
  task: Task;
  reason: "blocked" | "aging";
  /** When someone other than the assignee last changed the task, or when it was created. */
  lastOtherActionAt: string;
  workingDaysUnattended: number;
}

/**
 * FR-54: blocked tasks, and tasks in progress longer than expected for their
 * complexity, that nobody other than their assignee has changed for
 * UNATTENDED_WORKING_DAYS. Longest unattended first.
 */
export function unattendedTasks(
  tasks: Task[],
  blockers: Blocker[],
  ledger: LedgerRecord[],
  date: string,
): UnattendedTaskRow[] {
  const rows: UnattendedTaskRow[] = [];
  for (const task of tasks) {
    const records = taskRecords(task.id, blockers, ledger);
    let reason: UnattendedTaskRow["reason"] | null = null;
    if (task.status === "blocked") {
      reason = "blocked";
    } else if (task.status === "in_progress") {
      const since =
        latest(records.filter((l) => l.toValue === "in_progress").map((l) => l.occurredAt)) ?? task.createdAt;
      if (getWorkingDaysElapsed(since, date) > SYSTEM_CONFIG.AGING_WIP_WORKING_DAYS[task.complexity]) {
        reason = "aging";
      }
    }
    if (!reason) continue;

    const lastOtherActionAt =
      latest(records.filter((l) => l.actorId !== task.assigneeId).map((l) => l.occurredAt)) ?? task.createdAt;
    const workingDaysUnattended = getWorkingDaysElapsed(lastOtherActionAt, date);
    if (workingDaysUnattended >= SYSTEM_CONFIG.UNATTENDED_WORKING_DAYS) {
      rows.push({ task, reason, lastOtherActionAt, workingDaysUnattended });
    }
  }
  return rows.sort((a, b) => b.workingDaysUnattended - a.workingDaysUnattended);
}

export interface InactiveProjectRow {
  project: Project;
  lastActivityAt: string;
  workingDaysInactive: number;
}

/**
 * FR-55: active projects with no recorded change (on the project, its tasks or
 * their blockers) for longer than the inactivity limit — the same rule that
 * makes a project amber, so the list and the rating agree.
 */
export function inactiveProjects(
  projects: Project[],
  tasks: Task[],
  blockers: Blocker[],
  ledger: LedgerRecord[],
  date: string,
): InactiveProjectRow[] {
  return projects
    .filter((p) => p.state === "active")
    .map((project) => {
      const taskIds = new Set(tasks.filter((t) => t.projectId === project.id).map((t) => t.id));
      const blockerIds = new Set(blockers.filter((b) => taskIds.has(b.taskId)).map((b) => b.id));
      const lastActivityAt =
        latest(
          ledger
            .filter((l) => l.subjectId === project.id || taskIds.has(l.subjectId) || blockerIds.has(l.subjectId))
            .map((l) => l.occurredAt),
        ) ?? project.createdAt;
      return { project, lastActivityAt, workingDaysInactive: getWorkingDaysElapsed(lastActivityAt, date) };
    })
    .filter((row) => row.workingDaysInactive > SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS)
    .sort((a, b) => b.workingDaysInactive - a.workingDaysInactive);
}
