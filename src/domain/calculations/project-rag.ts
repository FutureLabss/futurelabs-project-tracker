import dayjs from "dayjs";
import { Project, RagStatus } from "../../entities/project.entity";
import { Task } from "../../entities/task.entity";
import { Blocker } from "../../entities/blocker.entity";
import { LedgerRecord } from "../../entities/ledger-record.entity";
import { getWorkingDaysElapsed } from "./working-days";
import { SYSTEM_CONFIG } from "../config/system-thresholds";

export interface ProjectRagEvaluation {
  status: RagStatus;
  reasons: string[];
}

export function evaluateProjectRag(
  project: Project,
  tasks: Task[],
  blockers: Blocker[],
  ledger: LedgerRecord[],
  simulatedDate: string,
): ProjectRagEvaluation {
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const openTasks = projectTasks.filter(
    (t) => t.status !== "accepted" && t.status !== "cancelled",
  );

  const redReasons: string[] = [];
  const amberReasons: string[] = [];

  // 1. Critical Target Date Missed
  const targetPassed = dayjs(project.targetDate).isBefore(
    dayjs(simulatedDate),
    "day",
  );
  if (targetPassed && openTasks.length > 0) {
    redReasons.push(
      `Project target date (${project.targetDate}) has passed with ${openTasks.length} open task(s) remaining.`,
    );
  }

  // 2. Critical Stalled Work (Blocked or Aging WIP > 3 working days with zero manager action)
  for (const task of openTasks) {
    if (task.status === "blocked") {
      const activeBlocker = blockers.find(
        (b) => b.id === task.activeBlockerId && !b.clearedAt,
      );
      if (activeBlocker) {
        const daysBlocked = getWorkingDaysElapsed(
          activeBlocker.raisedAt,
          simulatedDate,
        );
        if (daysBlocked > 3) {
          // Check if manager intervened since blocker raised
          const managerAction = ledger.find(
            (l) =>
              l.subjectId === task.id &&
              l.actorId === project.managerId &&
              dayjs(l.occurredAt).isAfter(dayjs(activeBlocker.raisedAt)),
          );
          if (!managerAction) {
            redReasons.push(
              `Task "${task.title}" blocked for ${daysBlocked} working days without manager intervention.`,
            );
          }
        }
      }
    }
  }

  // 3. Amber Checks
  // A. Overdue active tasks
  const overdueTasks = openTasks.filter((t) =>
    dayjs(t.dueDate).isBefore(dayjs(simulatedDate), "day"),
  );
  if (overdueTasks.length > 0) {
    amberReasons.push(`${overdueTasks.length} task(s) currently overdue.`);
  }

  // B. Project Slip Count >= 2
  const projectTaskIds = new Set(projectTasks.map((t) => t.id));
  const slipCount = ledger.filter((l) => {
    if (l.type !== "task_redated") return false;
    if (!projectTaskIds.has(l.subjectId)) return false;
    if (!l.fromValue || !l.toValue) return false;
    return dayjs(l.toValue).isAfter(dayjs(l.fromValue), "day");
  }).length;

  if (slipCount >= SYSTEM_CONFIG.SLIP_ALERT_COUNT_THRESHOLD) {
    amberReasons.push(
      `Task deadlines slipped ${slipCount} times across the project.`,
    );
  }

  // C. Inactive Project (No ledger change in > 5 working days)
  const projectLedger = ledger.filter(
    (l) => l.subjectId === project.id || projectTaskIds.has(l.subjectId),
  );
  if (projectLedger.length > 0) {
    const latestEvent = projectLedger.reduce((latest, current) =>
      dayjs(current.occurredAt).isAfter(dayjs(latest.occurredAt))
        ? current
        : latest,
    );
    const daysInactive = getWorkingDaysElapsed(
      latestEvent.occurredAt,
      simulatedDate,
    );
    if (daysInactive > SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS) {
      amberReasons.push(
        `Zero ledger activity recorded in ${daysInactive} working days (threshold: 5 days).`,
      );
    }
  } else {
    const daysSinceCreated = getWorkingDaysElapsed(
      project.createdAt,
      simulatedDate,
    );
    if (daysSinceCreated > SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS) {
      amberReasons.push(
        `No activity since project creation (${daysSinceCreated} working days ago).`,
      );
    }
  }

  if (redReasons.length > 0) {
    return { status: "red", reasons: redReasons };
  }
  if (amberReasons.length > 0) {
    return { status: "amber", reasons: amberReasons };
  }
  return {
    status: "green",
    reasons: ["Project is progressing on schedule with healthy velocity."],
  };
}
