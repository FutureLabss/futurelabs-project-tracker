import dayjs from "dayjs";
import type { Availability } from "../../entities/availability.entity";
import type { Blocker } from "../../entities/blocker.entity";
import type { AttentionItem } from "../../entities/operational-signals.entity";
import type { LedgerRecord } from "../../entities/ledger-record.entity";
import type { Person } from "../../entities/person.entity";
import type { Project } from "../../entities/project.entity";
import type { Task } from "../../entities/task.entity";
import { SYSTEM_CONFIG } from "../config/system-thresholds";
import { getLeaveDaysInInterval, getWorkingDaysBetween, getWorkingDaysElapsed } from "./working-days";

const weightOf = (task: Task) => SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[task.complexity] ?? 0;
const isOpen = (task: Task) => task.status !== "accepted" && task.status !== "cancelled";
const localDay = (timestamp: string) => dayjs(timestamp).format("YYYY-MM-DD");
const inPeriod = (timestamp: string, from: string, to: string) => {
  const day = localDay(timestamp);
  return day >= from && day <= to;
};

export interface ManagerScope {
  projects: Project[];
  tasks: Task[];
  blockers: Blocker[];
  ledger: LedgerRecord[];
}

/** FR-50: everything a manager sees is limited to the projects they manage. */
export function scopeToManagedProjects(
  managerId: string,
  data: ManagerScope,
): ManagerScope {
  const projects = data.projects.filter((p) => p.managerId === managerId);
  const projectIds = new Set(projects.map((p) => p.id));
  const tasks = data.tasks.filter((t) => projectIds.has(t.projectId));
  const taskIds = new Set(tasks.map((t) => t.id));
  const blockers = data.blockers.filter((b) => taskIds.has(b.taskId));
  const blockerIds = new Set(blockers.map((b) => b.id));
  const ledger = data.ledger.filter(
    (r) => projectIds.has(r.subjectId) || taskIds.has(r.subjectId) || blockerIds.has(r.subjectId),
  );
  return { projects, tasks, blockers, ledger };
}

/** The project a change record belongs to, whatever its subject type. */
export function projectIdOfRecord(record: LedgerRecord, scope: ManagerScope): string | null {
  if (record.subjectType === "project") return record.subjectId;
  if (record.subjectType === "task")
    return scope.tasks.find((t) => t.id === record.subjectId)?.projectId ?? null;
  if (record.subjectType === "blocker") {
    const taskId = scope.blockers.find((b) => b.id === record.subjectId)?.taskId;
    return scope.tasks.find((t) => t.id === taskId)?.projectId ?? null;
  }
  return null;
}

export interface OpenBlockerRow {
  blocker: Blocker;
  task: Task | undefined;
  causingTask: Task | undefined;
  daysOpen: number;
}

/** FR-34 / FR-36 / SR-12: open blockers, longest-open first, in working days. */
export function openBlockersByAge(blockers: Blocker[], tasks: Task[], date: string): OpenBlockerRow[] {
  return blockers
    .filter((b) => !b.clearedAt)
    .map((blocker) => ({
      blocker,
      task: tasks.find((t) => t.id === blocker.taskId),
      causingTask: blocker.blockingTaskId
        ? tasks.find((t) => t.id === blocker.blockingTaskId)
        : undefined,
      daysOpen: getWorkingDaysElapsed(blocker.raisedAt, date),
    }))
    .sort((a, b) => b.daysOpen - a.daysOpen || a.blocker.raisedAt.localeCompare(b.blocker.raisedAt));
}

export interface DueSoonRow {
  task: Task;
  workingDaysRemaining: number;
}

/**
 * FR-38: not-started work due within the imminent window, fewest days first.
 * Uses the same window as the member's DUE SOON flag so the assignee is never
 * warned later than their manager (SR-19).
 */
export function notStartedDueSoon(tasks: Task[], date: string): DueSoonRow[] {
  return tasks
    .filter((task) => {
      if (task.status !== "not_started") return false;
      const daysUntilDue = getWorkingDaysBetween(date, task.dueDate);
      return daysUntilDue >= 0 && daysUntilDue <= SYSTEM_CONFIG.IMMINENT_WARNING_WORKING_DAYS;
    })
    .map((task) => ({ task, workingDaysRemaining: getWorkingDaysElapsed(date, task.dueDate) }))
    .sort((a, b) => a.workingDaysRemaining - b.workingDaysRemaining || a.task.dueDate.localeCompare(b.task.dueDate));
}

export interface PersonLoadRow {
  personId: string | null;
  name: string;
  openTasks: number;
  openWeight: number;
}

/**
 * FR-40 / SR-15: open work per person, weighted by complexity. Ordered by name,
 * never by load, so the view does not rank people (NFR-02).
 */
export function openWorkByPerson(tasks: Task[], people: Person[]): PersonLoadRow[] {
  const rows = new Map<string | null, PersonLoadRow>();
  for (const task of tasks.filter(isOpen)) {
    const key = task.assigneeId;
    const row = rows.get(key) ?? {
      personId: key,
      name: key ? (people.find((p) => p.id === key)?.name ?? "Unknown person") : "Unassigned",
      openTasks: 0,
      openWeight: 0,
    };
    row.openTasks += 1;
    row.openWeight += weightOf(task);
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => {
    if (a.personId === null) return 1;
    if (b.personId === null) return -1;
    return a.name.localeCompare(b.name);
  });
}

export interface ProjectForecastRow {
  project: Project;
  openTasks: number;
  remainingWeight: number;
  acceptedWeightRecent: number;
  weeklyAcceptanceRate: number;
  weeksToFinish: number | null;
  slipCount: number;
}

/** Due dates moved later (moving a date earlier is not a slip, SR-14). */
export function countSlips(ledger: LedgerRecord[], taskIds: Set<string>): number {
  return ledger.filter(
    (r) =>
      r.type === "task_redated" &&
      taskIds.has(r.subjectId) &&
      !!r.fromValue &&
      !!r.toValue &&
      r.toValue > r.fromValue,
  ).length;
}

/**
 * FR-45 / FR-46: remaining weighted work beside the recent acceptance rate,
 * plus the project's accumulated slips.
 */
export function projectForecasts(
  projects: Project[],
  tasks: Task[],
  ledger: LedgerRecord[],
  date: string,
  recentWeeks = 4,
): ProjectForecastRow[] {
  const windowStart = dayjs(date).subtract(recentWeeks * 7, "day").format("YYYY-MM-DD");
  return projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const open = projectTasks.filter(isOpen);
    const remainingWeight = open.reduce((sum, t) => sum + weightOf(t), 0);
    const acceptedWeightRecent = projectTasks
      .filter((t) => t.status === "accepted" && t.acceptedAt && inPeriod(t.acceptedAt, windowStart, date))
      .reduce((sum, t) => sum + weightOf(t), 0);
    const weeklyAcceptanceRate = acceptedWeightRecent / recentWeeks;
    return {
      project,
      openTasks: open.length,
      remainingWeight,
      acceptedWeightRecent,
      weeklyAcceptanceRate,
      weeksToFinish:
        remainingWeight === 0 ? 0 : weeklyAcceptanceRate > 0 ? remainingWeight / weeklyAcceptanceRate : null,
      slipCount: countSlips(ledger, new Set(projectTasks.map((t) => t.id))),
    };
  });
}

export interface ShareResult {
  part: number;
  total: number;
  percent: number | null;
}

const share = (part: number, total: number): ShareResult => ({
  part,
  total,
  percent: total > 0 ? Math.round((part / total) * 100) : null,
});

/** FR-41: of the work created in the period, how much was unplanned (by complexity weight). */
export function unplannedShare(tasks: Task[], from: string, to: string): ShareResult & { count: ShareResult } {
  const created = tasks.filter((t) => inPeriod(t.createdAt, from, to));
  const unplanned = created.filter((t) => t.origin === "unplanned");
  return {
    ...share(
      unplanned.reduce((sum, t) => sum + weightOf(t), 0),
      created.reduce((sum, t) => sum + weightOf(t), 0),
    ),
    count: share(unplanned.length, created.length),
  };
}

/**
 * FR-44: of the tasks submitted in the period, how many were returned or
 * reopened within the same period.
 */
export function reworkShare(ledger: LedgerRecord[], taskIds: Set<string>, from: string, to: string): ShareResult {
  const events = ledger.filter((r) => taskIds.has(r.subjectId) && inPeriod(r.occurredAt, from, to));
  const submitted = new Set(events.filter((r) => r.type === "task_submitted").map((r) => r.subjectId));
  const reworked = new Set(
    events
      .filter((r) => (r.type === "task_returned" || r.type === "task_reopened") && submitted.has(r.subjectId))
      .map((r) => r.subjectId),
  );
  return share(reworked.size, submitted.size);
}

export interface StaleRow {
  task: Task;
  lastActivityAt: string;
  inactiveWorkingDays: number;
}

/**
 * FR-39 / SR-09 / SR-13: open tasks with no recorded change for the stale
 * threshold, not counting days the assignee was on leave. Same rule as the
 * derived signals, but reported on its own rather than only when overdue.
 */
export function staleTasks(
  tasks: Task[],
  ledger: LedgerRecord[],
  availabilities: Availability[],
  date: string,
): StaleRow[] {
  return tasks
    .filter(isOpen)
    .map((task) => {
      const lastActivityAt = ledger
        .filter((r) => r.subjectId === task.id)
        .reduce((latest, r) => (r.occurredAt > latest ? r.occurredAt : latest), task.createdAt);
      const raw = getWorkingDaysElapsed(lastActivityAt, date);
      const leave = task.assigneeId
        ? getLeaveDaysInInterval(task.assigneeId, lastActivityAt, date, availabilities)
        : 0;
      return { task, lastActivityAt, inactiveWorkingDays: Math.max(0, raw - leave) };
    })
    .filter((row) => row.inactiveWorkingDays >= SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS)
    .sort((a, b) => b.inactiveWorkingDays - a.inactiveWorkingDays);
}

/**
 * FR-31 / FR-32: one attention list for the manager's projects. Starts from
 * the derived signals and adds what they leave out: blocked tasks from the
 * first day, not-started work due soon, and inactive work that is not overdue.
 * Overdue-and-stale entries (silent overruns) always come first.
 */
export function managerAttentionList(
  signalItems: AttentionItem[],
  scope: ManagerScope,
  extra: {
    blockers: OpenBlockerRow[];
    dueSoon: DueSoonRow[];
    stale: StaleRow[];
    personName: (id: string | null) => string;
  },
): AttentionItem[] {
  const projectIds = new Set(scope.projects.map((p) => p.id));
  const projectName = (id: string) => scope.projects.find((p) => p.id === id)?.name ?? "Unknown project";
  const items = signalItems.filter((i) => i.projectId && projectIds.has(i.projectId));
  const covered = (taskId: string, types: AttentionItem["signalType"][]) =>
    items.some((i) => i.taskId === taskId && types.includes(i.signalType));
  const base = (task: Task) => ({
    taskId: task.id,
    projectId: task.projectId,
    taskTitle: task.title,
    projectName: projectName(task.projectId),
    assigneeId: task.assigneeId,
    assigneeName: extra.personName(task.assigneeId),
    dueDate: task.dueDate,
    complexity: task.complexity,
  });

  for (const row of extra.blockers) {
    if (!row.task || covered(row.task.id, ["aging_blocker", "silent_overrun"])) continue;
    items.push({
      ...base(row.task),
      id: `blocked-${row.blocker.id}`,
      signalType: "blocked",
      severity: "warning",
      headline: `Blocked: ${row.task.title}`,
      details: `Blocked for ${row.daysOpen} working day(s). ${extra.personName(row.blocker.ownerId)} can clear it.`,
      daysStalled: row.daysOpen,
    });
  }
  for (const row of extra.dueSoon) {
    if (covered(row.task.id, ["imminent_unstarted"])) continue;
    items.push({
      ...base(row.task),
      id: `due-soon-${row.task.id}`,
      signalType: "imminent_unstarted",
      severity: "warning",
      headline: `Not started, due soon: ${row.task.title}`,
      details:
        row.workingDaysRemaining === 0
          ? `Due today (${row.task.dueDate}) and not started.`
          : `Due ${row.task.dueDate}, ${row.workingDaysRemaining} working day(s) left, not started.`,
    });
  }
  for (const row of extra.stale) {
    if (covered(row.task.id, ["silent_overrun", "stale_inactivity"])) continue;
    items.push({
      ...base(row.task),
      id: `stale-${row.task.id}`,
      signalType: "stale_inactivity",
      severity: "warning",
      headline: `No recent activity: ${row.task.title}`,
      details: `No change recorded for ${row.inactiveWorkingDays} working day(s).`,
      daysStalled: row.inactiveWorkingDays,
    });
  }
  const rank = (i: AttentionItem) => (i.signalType === "silent_overrun" ? 0 : i.severity === "critical" ? 1 : 2);
  return items.sort((a, b) => rank(a) - rank(b) || (b.daysStalled ?? 0) - (a.daysStalled ?? 0));
}
