import dayjs from "dayjs";
import type { AdminWorkspace } from "../../../api/hooks/use-admin-workspace";
import { unplannedShare } from "../../../domain/calculations/manager-insights";
import { acceptanceEvents } from "../../../domain/calculations/admin-insights";

export const isOpen = (task: { status: string }) =>
  !["accepted", "cancelled"].includes(task.status);
export const readable = (value: string) => value.replaceAll("_", " ");
export function eligiblePeople(data: AdminWorkspace, projectId: string) {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) return [];

  const projectMemberIds = new Set(
    data.members
      .filter((member) => member.projectId === projectId)
      .map((member) => member.personId),
  );

  // Administrators are never task owners: only the project's manager and members.
  return data.people.filter(
    (p) =>
      p.status !== "inactive" &&
      p.role !== "admin" &&
      (p.id === project.managerId || projectMemberIds.has(p.id)),
  );
}
// Quote every cell, escape CSV quotes, and neutralize spreadsheet formula input.
export function toCsv(rows: unknown[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let cell = String(value ?? "");
          if (/^[\s]*[=+@-]/.test(cell) || /^[\t\r\n]/.test(cell))
            cell = "'" + cell;
          return '"' + cell.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
export function downloadCsv(name: string, rows: unknown[][]) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type AnalyticsPreset = "7d" | "30d" | "90d" | "180d" | "custom";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export const COMPLEXITY_WEIGHTS: Record<string, number> = {
  low: 1,
  mid: 2,
  high: 3,
};

export function getComplexityWeight(complexity?: string): number {
  if (!complexity) return 1;
  return COMPLEXITY_WEIGHTS[complexity.toLowerCase()] ?? 1;
}

export function computeDateRange(
  preset: AnalyticsPreset,
  reportingDate: string,
  customRange?: Partial<DateRange>,
): DateRange {
  if (preset === "custom" && customRange?.startDate && customRange?.endDate) {
    let start = customRange.startDate;
    let end = customRange.endDate;
    if (end > reportingDate) end = reportingDate;
    if (start > end) start = end;
    return { startDate: start, endDate: end };
  }
  const days =
    preset === "7d"
      ? 7
      : preset === "90d"
        ? 90
        : preset === "180d"
          ? 180
          : 30;
  const [y, m, d] = reportingDate.split("-").map(Number);
  const endUtc = new Date(Date.UTC(y, m - 1, d));
  const startUtc = new Date(endUtc);
  startUtc.setUTCDate(startUtc.getUTCDate() - days);
  return {
    startDate: startUtc.toISOString().slice(0, 10),
    endDate: reportingDate,
  };
}

export function getPreviousPeriod(currentRange: DateRange): DateRange {
  const [sy, sm, sd] = currentRange.startDate.split("-").map(Number);
  const [ey, em, ed] = currentRange.endDate.split("-").map(Number);
  const startUtc = new Date(Date.UTC(sy, sm - 1, sd));
  const endUtc = new Date(Date.UTC(ey, em - 1, ed));
  const diffTime = Math.max(0, endUtc.getTime() - startUtc.getTime());
  const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const prevEndUtc = new Date(startUtc);
  prevEndUtc.setUTCDate(prevEndUtc.getUTCDate() - 1);
  const prevStartUtc = new Date(prevEndUtc);
  prevStartUtc.setUTCDate(prevStartUtc.getUTCDate() - diffDays + 1);

  return {
    startDate: prevStartUtc.toISOString().slice(0, 10),
    endDate: prevEndUtc.toISOString().slice(0, 10),
  };
}



export interface PeriodMetrics {
  acceptedCount: number;
  acceptedWeight: number;
  totalSubmissions: number;
  totalReturns: number;
  reworkRatePercent: number;
  dateChanges: number;
  unplannedAcceptedCount: number;
  unplannedAcceptedWeight: number;
  plannedAcceptedWeight: number;
  unplannedCapacityPercent: number;
}

export interface TrendMetrics {
  acceptedDelta: number;
  weightDelta: number;
  reworkRateDelta: number;
  dateChangesDelta: number;
  unplannedCapacityDelta: number;
}

export interface ProjectBreakdownItem {
  projectId: string;
  projectName: string;
  managerId: string | null;
  managerName: string;
  acceptedCount: number;
  acceptedWeight: number;
  returnsCount: number;
  dateChangesCount: number;
  openTasksCount: number;
}

// Per-person delivery comparisons were removed: NFR-02 forbids ranking or comparing people.

/** A timestamp's calendar day in local time (not UTC), for period filters. */
export const localDay = (timestamp: string) => dayjs(timestamp).format("YYYY-MM-DD");

export function calculatePeriodMetrics(
  data: AdminWorkspace,
  dateRange: DateRange,
  projectId?: string | null,
): PeriodMetrics {
  const inRange = (timestamp: string) => {
    const day = localDay(timestamp);
    return day >= dateRange.startDate && day <= dateRange.endDate;
  };
  const matchingTasks = data.tasks.filter((t) =>
    projectId ? t.projectId === projectId : true,
  );
  const taskById = new Map(matchingTasks.map((t) => [t.id, t]));
  const blockerIds = new Set(
    data.blockers.filter((b) => taskById.has(b.taskId)).map((b) => b.id),
  );
  const relevantLedger = data.ledger.filter(
    (r) =>
      inRange(r.occurredAt) &&
      (projectId
        ? r.subjectId === projectId || taskById.has(r.subjectId) || blockerIds.has(r.subjectId)
        : true),
  );

  // FR-56: acceptances come from the change log, so later reopening does not erase them.
  const acceptances = acceptanceEvents(matchingTasks, data.ledger).filter(
    (e) => taskById.has(e.taskId) && inRange(e.occurredAt),
  );
  const acceptedCount = acceptances.length;
  const acceptedWeight = acceptances.reduce(
    (sum, e) => sum + getComplexityWeight(taskById.get(e.taskId)!.complexity),
    0,
  );

  // FR-57: of the work created in the period, how much was unplanned (same as the manager view).
  const unplanned = unplannedShare(matchingTasks, dateRange.startDate, dateRange.endDate);

  // FR-59: returned or reopened after submission.
  const totalSubmissions = relevantLedger.filter((l) => l.type === "task_submitted").length;
  const totalReturns = relevantLedger.filter(
    (l) => l.type === "task_returned" || l.type === "task_reopened",
  ).length;
  const reworkRatePercent =
    totalSubmissions > 0 ? (totalReturns / totalSubmissions) * 100 : 0;

  // FR-58: due dates moved later only.
  const dateChanges = relevantLedger.filter(
    (l) => l.type === "task_redated" && !!l.fromValue && !!l.toValue && l.toValue > l.fromValue,
  ).length;

  return {
    acceptedCount,
    acceptedWeight,
    totalSubmissions,
    totalReturns,
    reworkRatePercent,
    dateChanges,
    unplannedAcceptedCount: unplanned.count.part,
    unplannedAcceptedWeight: unplanned.part,
    plannedAcceptedWeight: unplanned.total - unplanned.part,
    unplannedCapacityPercent: unplanned.percent ?? 0,
  };
}

export function calculatePeriodAnalytics(
  data: AdminWorkspace,
  dateRange: DateRange,
  projectId?: string | null,
) {
  const current = calculatePeriodMetrics(data, dateRange, projectId);
  const previousRange = getPreviousPeriod(dateRange);
  const previous = calculatePeriodMetrics(data, previousRange, projectId);

  const trends: TrendMetrics = {
    acceptedDelta: current.acceptedCount - previous.acceptedCount,
    weightDelta: current.acceptedWeight - previous.acceptedWeight,
    reworkRateDelta: current.reworkRatePercent - previous.reworkRatePercent,
    dateChangesDelta: current.dateChanges - previous.dateChanges,
    unplannedCapacityDelta:
      current.unplannedCapacityPercent - previous.unplannedCapacityPercent,
  };

  const projectBreakdown: ProjectBreakdownItem[] = data.projects.map((p) => {
    const pMetrics = calculatePeriodMetrics(data, dateRange, p.id);
    const openTasksCount = data.tasks.filter(
      (t) => t.projectId === p.id && isOpen(t),
    ).length;
    const manager = data.people.find((person) => person.id === p.managerId);
    return {
      projectId: p.id,
      projectName: p.name,
      managerId: p.managerId,
      managerName: manager?.name ?? "Unmanaged",
      acceptedCount: pMetrics.acceptedCount,
      acceptedWeight: pMetrics.acceptedWeight,
      returnsCount: pMetrics.totalReturns,
      dateChangesCount: pMetrics.dateChanges,
      openTasksCount,
    };
  });

  return {
    current,
    previous,
    previousRange,
    trends,
    projectBreakdown,
  };
}
