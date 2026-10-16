import type { AdminWorkspace } from "../../../api/hooks/use-admin-workspace";

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

  return data.people.filter(
    (p) =>
      p.status !== "inactive" &&
      (p.role === "admin" ||
        p.id === project.managerId ||
        projectMemberIds.has(p.id)),
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

export interface PersonBreakdownItem {
  personId: string;
  name: string;
  role: string;
  status: string;
  acceptedCount: number;
  acceptedWeight: number;
  returnsCount: number;
  activeTasksCount: number;
}

export function calculatePeriodMetrics(
  data: AdminWorkspace,
  dateRange: DateRange,
  projectId?: string | null,
): PeriodMetrics {
  const matchingTasks = data.tasks.filter((t) =>
    projectId ? t.projectId === projectId : true,
  );
  const taskIds = new Set(matchingTasks.map((t) => t.id));

  const acceptedTasks = matchingTasks.filter(
    (t) =>
      t.status === "accepted" &&
      !!t.acceptedAt &&
      t.acceptedAt.slice(0, 10) >= dateRange.startDate &&
      t.acceptedAt.slice(0, 10) <= dateRange.endDate,
  );

  const acceptedCount = acceptedTasks.length;
  const acceptedWeight = acceptedTasks.reduce(
    (sum, t) => sum + getComplexityWeight(t.complexity),
    0,
  );

  const unplannedAccepted = acceptedTasks.filter((t) => t.origin === "unplanned");
  const unplannedAcceptedWeight = unplannedAccepted.reduce(
    (sum, t) => sum + getComplexityWeight(t.complexity),
    0,
  );
  const plannedAccepted = acceptedTasks.filter((t) => t.origin === "planned");
  const plannedAcceptedWeight = plannedAccepted.reduce(
    (sum, t) => sum + getComplexityWeight(t.complexity),
    0,
  );
  const totalDeliveredWeight = unplannedAcceptedWeight + plannedAcceptedWeight;
  const unplannedCapacityPercent =
    totalDeliveredWeight > 0
      ? (unplannedAcceptedWeight / totalDeliveredWeight) * 100
      : 0;

  const relevantLedger = data.ledger.filter((r) => {
    const occurredDate = r.occurredAt.slice(0, 10);
    if (occurredDate < dateRange.startDate || occurredDate > dateRange.endDate) {
      return false;
    }
    if (projectId) {
      return (
        r.subjectId === projectId ||
        (r.subjectType === "task" && taskIds.has(r.subjectId))
      );
    }
    return true;
  });

  const totalSubmissions = relevantLedger.filter(
    (l) => l.type === "task_submitted",
  ).length;
  const totalReturns = relevantLedger.filter(
    (l) => l.type === "task_returned",
  ).length;
  const reworkRatePercent =
    totalSubmissions > 0 ? (totalReturns / totalSubmissions) * 100 : 0;

  const dateChanges = relevantLedger.filter(
    (l) => l.type === "task_redated",
  ).length;

  return {
    acceptedCount,
    acceptedWeight,
    totalSubmissions,
    totalReturns,
    reworkRatePercent,
    dateChanges,
    unplannedAcceptedCount: unplannedAccepted.length,
    unplannedAcceptedWeight,
    plannedAcceptedWeight,
    unplannedCapacityPercent,
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

  const personBreakdown: PersonBreakdownItem[] = data.people.map((person) => {
    const personAcceptedTasks = data.tasks.filter(
      (t) =>
        t.assigneeId === person.id &&
        t.status === "accepted" &&
        !!t.acceptedAt &&
        t.acceptedAt.slice(0, 10) >= dateRange.startDate &&
        t.acceptedAt.slice(0, 10) <= dateRange.endDate,
    );
    const personTaskIds = new Set(
      data.tasks.filter((t) => t.assigneeId === person.id).map((t) => t.id),
    );
    const personReturns = data.ledger.filter((r) => {
      const occurredDate = r.occurredAt.slice(0, 10);
      return (
        occurredDate >= dateRange.startDate &&
        occurredDate <= dateRange.endDate &&
        r.type === "task_returned" &&
        personTaskIds.has(r.subjectId)
      );
    }).length;
    const activeTasksCount = data.tasks.filter(
      (t) => t.assigneeId === person.id && isOpen(t),
    ).length;

    return {
      personId: person.id,
      name: person.name,
      role: person.role,
      status: person.status ?? "active",
      acceptedCount: personAcceptedTasks.length,
      acceptedWeight: personAcceptedTasks.reduce(
        (sum, t) => sum + getComplexityWeight(t.complexity),
        0,
      ),
      returnsCount: personReturns,
      activeTasksCount,
    };
  });

  return {
    current,
    previous,
    previousRange,
    trends,
    projectBreakdown,
    personBreakdown,
  };
}
