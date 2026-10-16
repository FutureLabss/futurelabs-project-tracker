import dayjs from "dayjs";
import { Project, RagStatus } from "../../entities/project.entity";
import { Task } from "../../entities/task.entity";
import { Blocker } from "../../entities/blocker.entity";
import { LedgerRecord } from "../../entities/ledger-record.entity";
import { getWorkingDaysElapsed } from "./working-days";
import { SYSTEM_CONFIG } from "../config/system-thresholds";

export interface ProjectRagEvaluation {
  status: RagStatus;
  /** Every reason found, red ones first (FR-53). */
  reasons: string[];
}

const latest = (timestamps: string[]): string | null =>
  timestamps.reduce<string | null>((max, t) => (!max || t > max ? t : max), null);

/**
 * SR-17 / SR-18: the project risk rating, derived only from project data.
 * RED: target date passed with open work, or a task blocked / in progress too
 * long with no action from the project's manager. AMBER: overdue work, no
 * project activity for longer than the inactivity threshold, or repeated slips.
 */
export function evaluateProjectRag(
  project: Project,
  tasks: Task[],
  blockers: Blocker[],
  ledger: LedgerRecord[],
  simulatedDate: string,
): ProjectRagEvaluation {
  if (project.state === "closed") {
    return { status: "green", reasons: ["Project is closed and no longer rated."] };
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const openTasks = projectTasks.filter(
    (t) => t.status !== "accepted" && t.status !== "cancelled",
  );
  const projectTaskIds = new Set(projectTasks.map((t) => t.id));
  const projectBlockers = blockers.filter((b) => projectTaskIds.has(b.taskId));
  const projectBlockerIds = new Set(projectBlockers.map((b) => b.id));

  // Records about a task include records about its blockers.
  const recordsForTask = (taskId: string) => {
    const blockerIds = new Set(projectBlockers.filter((b) => b.taskId === taskId).map((b) => b.id));
    return ledger.filter((l) => l.subjectId === taskId || blockerIds.has(l.subjectId));
  };
  const managerActedSince = (taskId: string, since: string) =>
    !!project.managerId &&
    recordsForTask(taskId).some((l) => l.actorId === project.managerId && l.occurredAt > since);

  const redReasons: string[] = [];
  const amberReasons: string[] = [];

  // RED 1: target date passed with open work.
  if (dayjs(project.targetDate).isBefore(dayjs(simulatedDate), "day") && openTasks.length > 0) {
    redReasons.push(
      `Target date (${project.targetDate}) has passed with ${openTasks.length} open task(s).`,
    );
  }

  // RED 2: blocked or aging work the project's manager has not acted on.
  for (const task of openTasks) {
    if (task.status === "blocked") {
      const blocker = projectBlockers.find((b) => b.id === task.activeBlockerId && !b.clearedAt);
      if (!blocker) continue;
      const daysBlocked = getWorkingDaysElapsed(blocker.raisedAt, simulatedDate);
      if (daysBlocked > SYSTEM_CONFIG.AGING_BLOCKER_WORKING_DAYS && !managerActedSince(task.id, blocker.raisedAt)) {
        redReasons.push(
          `"${task.title}" blocked for ${daysBlocked} working days with no action from the project manager.`,
        );
      }
    } else if (task.status === "in_progress") {
      const since =
        latest(recordsForTask(task.id).filter((l) => l.toValue === "in_progress").map((l) => l.occurredAt)) ??
        task.createdAt;
      const daysInProgress = getWorkingDaysElapsed(since, simulatedDate);
      const expected = SYSTEM_CONFIG.AGING_WIP_WORKING_DAYS[task.complexity];
      if (daysInProgress > expected && !managerActedSince(task.id, since)) {
        redReasons.push(
          `"${task.title}" in progress for ${daysInProgress} working days (expected ${expected} for ${task.complexity}) with no action from the project manager.`,
        );
      }
    }
  }

  // AMBER 1: overdue work.
  const overdue = openTasks.filter((t) => dayjs(t.dueDate).isBefore(dayjs(simulatedDate), "day"));
  if (overdue.length > 0) {
    amberReasons.push(`${overdue.length} task(s) overdue.`);
  }

  // AMBER 2: due dates moved later repeatedly (moving earlier is not a slip, SR-14).
  const slipCount = ledger.filter(
    (l) =>
      l.type === "task_redated" &&
      projectTaskIds.has(l.subjectId) &&
      !!l.fromValue &&
      !!l.toValue &&
      dayjs(l.toValue).isAfter(dayjs(l.fromValue), "day"),
  ).length;
  if (slipCount >= SYSTEM_CONFIG.SLIP_ALERT_COUNT_THRESHOLD) {
    amberReasons.push(`Due dates moved later ${slipCount} times across the project.`);
  }

  // AMBER 3: no recorded activity on the project, its tasks or their blockers.
  const lastActivity =
    latest(
      ledger
        .filter(
          (l) =>
            l.subjectId === project.id || projectTaskIds.has(l.subjectId) || projectBlockerIds.has(l.subjectId),
        )
        .map((l) => l.occurredAt),
    ) ?? project.createdAt;
  const daysInactive = getWorkingDaysElapsed(lastActivity, simulatedDate);
  if (daysInactive > SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS) {
    amberReasons.push(
      `No activity for ${daysInactive} working days (limit ${SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS}).`,
    );
  }

  if (redReasons.length > 0) return { status: "red", reasons: [...redReasons, ...amberReasons] };
  if (amberReasons.length > 0) return { status: "amber", reasons: amberReasons };
  return {
    status: "green",
    reasons: ["No overdue work, stalled tasks, long inactivity or repeated slips."],
  };
}
