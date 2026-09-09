import dayjs from "dayjs";
import { Person } from "../../entities/person.entity";
import { Project } from "../../entities/project.entity";
import { Task } from "../../entities/task.entity";
import { Blocker, BlockerCategory } from "../../entities/blocker.entity";
import { Availability } from "../../entities/availability.entity";
import { LedgerRecord } from "../../entities/ledger-record.entity";
import {
  AttentionItem,
  BlockerCategoryCount,
  MemberSignalSummary,
  OperationalSignalsPayload,
  OrgMetricSummary,
  ProjectHealthSummary,
} from "../../entities/operational-signals.entity";
import { SYSTEM_CONFIG } from "../config/system-thresholds";
import {
  getLeaveDaysInInterval,
  getWorkingDaysBetween,
  getWorkingDaysElapsed,
} from "./working-days";
import { evaluateProjectRag } from "./project-rag";

export function calculateOperationalSignals(
  persons: Person[],
  projects: Project[],
  tasks: Task[],
  blockers: Blocker[],
  availabilities: Availability[],
  ledger: LedgerRecord[],
  simulatedDate: string,
): OperationalSignalsPayload {
  const simDay = dayjs(simulatedDate).startOf("day");
  const activeTasks = tasks.filter(
    (t) => t.status !== "accepted" && t.status !== "cancelled",
  );

  const attentionItems: AttentionItem[] = [];

  // Helper map for quick lookups
  const personMap = new Map<string, Person>(persons.map((p) => [p.id, p]));
  const projectMap = new Map<string, Project>(projects.map((p) => [p.id, p]));

  // 1. Process Attention Items across active tasks
  for (const task of activeTasks) {
    const project = projectMap.get(task.projectId);
    const projectName = project ? project.name : "Unknown Project";
    const assignee = task.assigneeId ? personMap.get(task.assigneeId) : null;
    const assigneeName = assignee ? assignee.name : "Unassigned";

    // A. Check Overdue
    const isOverdue = dayjs(task.dueDate).isBefore(simDay, "day");
    const overdueDays = isOverdue
      ? Math.max(1, getWorkingDaysElapsed(task.dueDate, simulatedDate))
      : 0;

    // B. Check Last Activity & Staleness (adjusted for leave)
    const taskLedger = ledger.filter((l) => l.subjectId === task.id);
    const lastActivityTimestamp =
      taskLedger.length > 0
        ? taskLedger.reduce((latest, l) =>
            dayjs(l.occurredAt).isAfter(dayjs(latest.occurredAt)) ? l : latest,
          ).occurredAt
        : task.createdAt;

    const rawInactiveWorkingDays = getWorkingDaysElapsed(
      lastActivityTimestamp,
      simulatedDate,
    );

    const leaveDays = task.assigneeId
      ? getLeaveDaysInInterval(
          task.assigneeId,
          lastActivityTimestamp,
          simulatedDate,
          availabilities,
        )
      : 0;

    const adjustedInactiveWorkingDays = Math.max(
      0,
      rawInactiveWorkingDays - leaveDays,
    );
    const isStale =
      adjustedInactiveWorkingDays >=
      SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS;

    // C. Check Silent Overrun (Overdue + Stale) -> PINNED TOP PRIORITY CRITICAL
    if (isOverdue && isStale) {
      attentionItems.push({
        id: `silent-overrun-${task.id}`,
        taskId: task.id,
        projectId: task.projectId,
        taskTitle: task.title,
        projectName,
        assigneeId: task.assigneeId,
        assigneeName,
        signalType: "silent_overrun",
        severity: "critical",
        headline: `Silent Overrun: ${task.title}`,
        details: `Overdue by ${overdueDays} working day(s) with ${adjustedInactiveWorkingDays} working day(s) of complete inactivity. Immediate attention required.`,
        daysStalled: adjustedInactiveWorkingDays,
        dueDate: task.dueDate,
        complexity: task.complexity,
      });
      continue; // Avoid duplicate alerts for this task
    }

    // D. Check Overdue (Non-stale)
    if (isOverdue) {
      attentionItems.push({
        id: `overdue-${task.id}`,
        taskId: task.id,
        projectId: task.projectId,
        taskTitle: task.title,
        projectName,
        assigneeId: task.assigneeId,
        assigneeName,
        signalType: "overdue",
        severity: "warning",
        headline: `Overdue: ${task.title}`,
        details: `Due date (${task.dueDate}) was ${overdueDays} working day(s) ago.`,
        daysStalled: overdueDays,
        dueDate: task.dueDate,
        complexity: task.complexity,
      });
    }

    // E. Check Aging WIP (In Progress beyond complexity threshold)
    if (task.status === "in_progress") {
      const inProgEvents = ledger.filter(
        (l) =>
          l.subjectId === task.id &&
          l.type === "status_changed" &&
          l.toValue === "in_progress",
      );
      const inProgStart =
        inProgEvents.length > 0
          ? inProgEvents[inProgEvents.length - 1].occurredAt
          : task.createdAt;

      const inProgressDays = getWorkingDaysElapsed(inProgStart, simulatedDate);
      const maxAllowedDays =
        SYSTEM_CONFIG.AGING_WIP_WORKING_DAYS[task.complexity];

      if (inProgressDays > maxAllowedDays) {
        attentionItems.push({
          id: `aging-wip-${task.id}`,
          taskId: task.id,
          projectId: task.projectId,
          taskTitle: task.title,
          projectName,
          assigneeId: task.assigneeId,
          assigneeName,
          signalType: "aging_wip",
          severity:
            inProgressDays > maxAllowedDays + 3 ? "critical" : "warning",
          headline: `Aging WIP (${task.complexity.toUpperCase()} Complexity): ${task.title}`,
          details: `In progress for ${inProgressDays} working days (threshold: ${maxAllowedDays} days). May be blocked or under-scoped.`,
          daysStalled: inProgressDays,
          dueDate: task.dueDate,
          complexity: task.complexity,
        });
      }
    }

    // F. Check Aging Blockers
    if (task.status === "blocked" && task.activeBlockerId) {
      const blocker = blockers.find(
        (b) => b.id === task.activeBlockerId && !b.clearedAt,
      );
      if (blocker) {
        const blockerDays = getWorkingDaysElapsed(
          blocker.raisedAt,
          simulatedDate,
        );
        if (blockerDays >= SYSTEM_CONFIG.AGING_BLOCKER_WORKING_DAYS) {
          const owner = personMap.get(blocker.ownerId);
          const ownerName = owner ? owner.name : "Unknown Owner";
          attentionItems.push({
            id: `aging-blocker-${task.id}`,
            taskId: task.id,
            projectId: task.projectId,
            taskTitle: task.title,
            projectName,
            assigneeId: task.assigneeId,
            assigneeName,
            signalType: "aging_blocker",
            severity: blockerDays >= 5 ? "critical" : "warning",
            headline: `Aging Blocker (${SYSTEM_CONFIG.CATEGORY_LABELS[blocker.category]}): ${task.title}`,
            details: `Blocker raised ${blockerDays} working days ago assigned to resolver ${ownerName}: "${blocker.description}"`,
            daysStalled: blockerDays,
            dueDate: task.dueDate,
            complexity: task.complexity,
          });
        }
      }
    }

    // G. Check Unowned Tasks
    if (!task.assigneeId) {
      attentionItems.push({
        id: `unowned-task-${task.id}`,
        taskId: task.id,
        projectId: task.projectId,
        taskTitle: task.title,
        projectName,
        assigneeId: null,
        assigneeName: "Unassigned",
        signalType: "unowned_task",
        severity: "info",
        headline: `Unassigned Task: ${task.title}`,
        details: `Task belongs to ${projectName} with no designated owner.`,
        dueDate: task.dueDate,
        complexity: task.complexity,
      });
    }
  }

  // 2. Unmanaged Projects check
  for (const project of projects) {
    if (project.state === "active" && !project.managerId) {
      attentionItems.push({
        id: `unmanaged-project-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        assigneeId: null,
        assigneeName: "None",
        signalType: "unmanaged_project",
        severity: "warning",
        headline: `Unmanaged Project: ${project.name}`,
        details: `Project has no assigned manager lead responsible for deliverables.`,
      });
    }
  }

  // Sort attention items: Critical first, then Warning, then Info (Silent Overruns at the very top)
  const severityRank: Record<string, number> = {
    critical: 1,
    warning: 2,
    info: 3,
  };
  attentionItems.sort((a, b) => {
    if (a.signalType === "silent_overrun" && b.signalType !== "silent_overrun")
      return -1;
    if (b.signalType === "silent_overrun" && a.signalType !== "silent_overrun")
      return 1;
    return severityRank[a.severity] - severityRank[b.severity];
  });

  // 3. Member Signal Summaries (Psychological safety & Load calculation)
  const memberSummaries: Record<string, MemberSignalSummary> = {};
  const currentMonthStart = simDay.startOf("month");

  for (const person of persons) {
    const memberTasks = tasks.filter((t) => t.assigneeId === person.id);
    const memberActiveTasks = memberTasks.filter(
      (t) => t.status !== "accepted" && t.status !== "cancelled",
    );

    // Imminent warning calculation: Not started and due in <= 3 working days
    const imminentTasks = memberActiveTasks.filter((t) => {
      if (t.status !== "not_started") return false;
      const daysUntilDue = getWorkingDaysBetween(simulatedDate, t.dueDate);
      return (
        daysUntilDue >= 0 &&
        daysUntilDue <= SYSTEM_CONFIG.IMMINENT_WARNING_WORKING_DAYS
      );
    });

    const overdueCount = memberActiveTasks.filter((t) =>
      dayjs(t.dueDate).isBefore(simDay, "day"),
    ).length;

    // Size-weighted load
    const totalComplexityWeight = memberActiveTasks.reduce(
      (sum, t) => sum + SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[t.complexity],
      0,
    );

    // Accepted count & weight this month
    const acceptedThisMonth = memberTasks.filter((t) => {
      if (t.status !== "accepted" || !t.acceptedAt) return false;
      return dayjs(t.acceptedAt).isSameOrAfter(currentMonthStart, "day");
    });

    const acceptedWeightThisMonth = acceptedThisMonth.reduce(
      (sum, t) => sum + SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[t.complexity],
      0,
    );

    memberSummaries[person.id] = {
      personId: person.id,
      pendingImminentCount: imminentTasks.length,
      imminentTasks,
      activeTasksCount: memberActiveTasks.length,
      totalComplexityWeight,
      acceptedCountThisMonth: acceptedThisMonth.length,
      acceptedWeightThisMonth,
      overdueCount,
    };
  }

  // 4. Project Health Summaries
  const projectSummaries: ProjectHealthSummary[] = projects.map((project) => {
    const ragEval = evaluateProjectRag(
      project,
      tasks,
      blockers,
      ledger,
      simulatedDate,
    );
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const openTasks = projectTasks.filter(
      (t) => t.status !== "accepted" && t.status !== "cancelled",
    );
    const overdueTasks = openTasks.filter((t) =>
      dayjs(t.dueDate).isBefore(simDay, "day"),
    );
    const blockedTasks = openTasks.filter((t) => t.status === "blocked");

    const projectTaskIds = new Set(projectTasks.map((t) => t.id));
    const projectLedger = ledger.filter(
      (l) => l.subjectId === project.id || projectTaskIds.has(l.subjectId),
    );

    const lastActivity =
      projectLedger.length > 0
        ? projectLedger.reduce((latest, current) =>
            dayjs(current.occurredAt).isAfter(dayjs(latest.occurredAt))
              ? current
              : latest,
          ).occurredAt
        : null;

    const daysSinceLastActivity = lastActivity
      ? getWorkingDaysElapsed(lastActivity, simulatedDate)
      : getWorkingDaysElapsed(project.createdAt, simulatedDate);

    const slipCount = ledger.filter((l) => {
      if (l.type !== "task_redated") return false;
      if (!projectTaskIds.has(l.subjectId)) return false;
      if (!l.fromValue || !l.toValue) return false;
      return dayjs(l.toValue).isAfter(dayjs(l.fromValue), "day");
    }).length;

    const manager = project.managerId ? personMap.get(project.managerId) : null;

    return {
      projectId: project.id,
      projectName: project.name,
      goal: project.goal,
      startDate: project.startDate,
      targetDate: project.targetDate,
      managerId: project.managerId,
      managerName: manager ? manager.name : null,
      isUnmanaged: !project.managerId,
      ragStatus: ragEval.status,
      ragReasons: ragEval.reasons,
      totalTasks: projectTasks.length,
      openTasksCount: openTasks.length,
      overdueTasksCount: overdueTasks.length,
      blockedTasksCount: blockedTasks.length,
      slipCount,
      lastActivityDate: lastActivity,
      daysSinceLastActivity,
    };
  });

  // 5. Blocker Root Cause Analytics
  const blockerCategories: BlockerCategory[] = [
    "person",
    "external",
    "decision",
    "unclear_requirement",
  ];

  const blockerAnalytics: BlockerCategoryCount[] = blockerCategories.map(
    (cat) => {
      const catBlockers = blockers.filter((b) => b.category === cat);
      const active = catBlockers.filter((b) => !b.clearedAt);

      const resolved = catBlockers.filter((b) => b.clearedAt);
      let totalResolutionDays = 0;
      for (const r of resolved) {
        totalResolutionDays += Math.max(
          1,
          getWorkingDaysElapsed(r.raisedAt, r.clearedAt!),
        );
      }

      const avgResolutionDays =
        resolved.length > 0
          ? Math.round((totalResolutionDays / resolved.length) * 10) / 10
          : 0;

      return {
        category: cat,
        label: SYSTEM_CONFIG.CATEGORY_LABELS[cat],
        activeCount: active.length,
        avgResolutionDays,
      };
    },
  );

  // 6. Org Metrics Section (Throughput, Rework Rate, Planned vs Unplanned Ratio)
  const window30d = simDay.subtract(30, "day");
  const window6m = simDay.subtract(6, "month");

  const accepted30d = tasks.filter(
    (t) =>
      t.status === "accepted" &&
      t.acceptedAt &&
      dayjs(t.acceptedAt).isSameOrAfter(window30d),
  );
  const accepted6m = tasks.filter(
    (t) =>
      t.status === "accepted" &&
      t.acceptedAt &&
      dayjs(t.acceptedAt).isSameOrAfter(window6m),
  );

  const acceptedWeight30d = accepted30d.reduce(
    (s, t) => s + SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[t.complexity],
    0,
  );
  const acceptedWeight6m = accepted6m.reduce(
    (s, t) => s + SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[t.complexity],
    0,
  );

  const totalSubmissions = ledger.filter(
    (l) => l.type === "task_submitted",
  ).length;
  const totalReturns = ledger.filter((l) => l.type === "task_returned").length;
  const reworkRatePercent =
    totalSubmissions > 0
      ? Math.round((totalReturns / totalSubmissions) * 100)
      : 0;

  const plannedActiveTasks = activeTasks.filter((t) => t.origin === "planned");
  const unplannedActiveTasks = activeTasks.filter(
    (t) => t.origin === "unplanned",
  );

  const plannedWeight = plannedActiveTasks.reduce(
    (s, t) => s + SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[t.complexity],
    0,
  );
  const unplannedWeight = unplannedActiveTasks.reduce(
    (s, t) => s + SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[t.complexity],
    0,
  );
  const totalActiveWeight = plannedWeight + unplannedWeight;

  const unplannedCapacityPercent =
    totalActiveWeight > 0
      ? Math.round((unplannedWeight / totalActiveWeight) * 100)
      : 0;

  const unassignedTasksCount = activeTasks.filter((t) => !t.assigneeId).length;
  const unmanagedProjectsCount = projects.filter(
    (p) => p.state === "active" && !p.managerId,
  ).length;

  const orgMetrics: OrgMetricSummary = {
    acceptedThroughput30d: accepted30d.length,
    acceptedWeight30d,
    acceptedThroughput6m: accepted6m.length,
    acceptedWeight6m,
    totalSubmissions,
    totalReturns,
    reworkRatePercent,
    plannedWeight,
    unplannedWeight,
    unplannedCapacityPercent,
    unassignedTasksCount,
    unmanagedProjectsCount,
  };

  return {
    simulatedDate,
    attentionItems,
    projectSummaries,
    memberSummaries,
    orgMetrics,
    blockerAnalytics,
  };
}
