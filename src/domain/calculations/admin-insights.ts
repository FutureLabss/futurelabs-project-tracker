import dayjs from "dayjs";
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

const localDay = (timestamp: string) => dayjs(timestamp).format("YYYY-MM-DD");
const weightOf = (task: Task | undefined) => (task ? (SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[task.complexity] ?? 0) : 0);

export interface MonthlyDeliveryRow {
  month: string; // YYYY-MM
  label: string;
  acceptedCount: number;
  acceptedWeight: number;
  submissions: number;
  reworked: number;
  reworkPercent: number | null;
}

/**
 * FR-56 / FR-59: accepted work and the share returned or reopened, per month,
 * for the `months` months up to `date`. Built from change records, so work
 * that was accepted and later reopened still counts in the month it was accepted.
 */
export function monthlyDelivery(
  tasks: Task[],
  ledger: LedgerRecord[],
  date: string,
  months = 6,
): MonthlyDeliveryRow[] {
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const rows: MonthlyDeliveryRow[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = dayjs(date).startOf("month").subtract(i, "month");
    const month = start.format("YYYY-MM");
    const events = ledger.filter((l) => taskById.has(l.subjectId) && localDay(l.occurredAt).startsWith(month));
    const accepted = acceptanceEvents(tasks, ledger).filter(
      (e) => taskById.has(e.taskId) && localDay(e.occurredAt).startsWith(month),
    );
    const submitted = new Set(events.filter((l) => l.type === "task_submitted").map((l) => l.subjectId));
    const reworked = new Set(
      events
        .filter((l) => (l.type === "task_returned" || l.type === "task_reopened") && submitted.has(l.subjectId))
        .map((l) => l.subjectId),
    );
    rows.push({
      month,
      label: start.format("MMM YYYY"),
      acceptedCount: accepted.length,
      acceptedWeight: accepted.reduce((sum, e) => sum + weightOf(taskById.get(e.taskId)), 0),
      submissions: submitted.size,
      reworked: reworked.size,
      reworkPercent: submitted.size ? Math.round((reworked.size / submitted.size) * 100) : null,
    });
  }
  return rows;
}

export interface BlockerCategoryReport {
  category: Blocker["category"];
  label: string;
  raisedInPeriod: number;
  openNow: number;
  /** Names of the projects whose tasks had blockers of this category raised in the period. */
  projectNames: string[];
}

/** FR-60: blockers recorded per category in a period, and which projects each category affects. */
export function blockerCategoryReport(
  blockers: Blocker[],
  tasks: Task[],
  projects: Project[],
  range: { startDate: string; endDate: string },
): BlockerCategoryReport[] {
  const projectOf = (taskId: string) => tasks.find((t) => t.id === taskId)?.projectId;
  return (Object.keys(SYSTEM_CONFIG.CATEGORY_LABELS) as Blocker["category"][]).map((category) => {
    const ofCategory = blockers.filter((b) => b.category === category && projectOf(b.taskId));
    const raised = ofCategory.filter((b) => {
      const day = localDay(b.raisedAt);
      return day >= range.startDate && day <= range.endDate;
    });
    const projectIds = new Set(raised.map((b) => projectOf(b.taskId)));
    return {
      category,
      label: SYSTEM_CONFIG.CATEGORY_LABELS[category],
      raisedInPeriod: raised.length,
      openNow: ofCategory.filter((b) => !b.clearedAt).length,
      projectNames: projects
        .filter((p) => projectIds.has(p.id))
        .map((p) => p.name)
        .sort(),
    };
  });
}

export interface AcceptanceEvent {
  taskId: string;
  occurredAt: string;
}

/**
 * Every acceptance from the change log. Accepted tasks with no acceptance
 * record (older data) fall back to their acceptedAt, so nothing is lost.
 */
export function acceptanceEvents(tasks: Task[], ledger: LedgerRecord[]): AcceptanceEvent[] {
  const events = ledger
    .filter((l) => l.type === "task_accepted")
    .map((l) => ({ taskId: l.subjectId, occurredAt: l.occurredAt }));
  const recorded = new Set(events.map((e) => e.taskId));
  for (const task of tasks) {
    if (task.status === "accepted" && task.acceptedAt && !recorded.has(task.id)) {
      events.push({ taskId: task.id, occurredAt: task.acceptedAt });
    }
  }
  return events;
}
