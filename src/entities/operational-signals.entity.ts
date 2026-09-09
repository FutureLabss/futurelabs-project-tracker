import { Task, TaskComplexity } from "./task.entity";
import { RagStatus } from "./project.entity";
import { BlockerCategory } from "./blocker.entity";

export type AttentionSeverity = "critical" | "warning" | "info";

export type SignalType =
  | "silent_overrun"
  | "aging_wip"
  | "aging_blocker"
  | "stale_inactivity"
  | "overdue"
  | "imminent_unstarted"
  | "unowned_task"
  | "unmanaged_project";

export interface AttentionItem {
  id: string;
  taskId?: string;
  projectId?: string;
  taskTitle?: string;
  projectName: string;
  assigneeId: string | null;
  assigneeName: string;
  signalType: SignalType;
  severity: AttentionSeverity;
  headline: string;
  details: string;
  daysStalled?: number;
  dueDate?: string;
  complexity?: TaskComplexity;
}

export interface MemberSignalSummary {
  personId: string;
  pendingImminentCount: number;
  imminentTasks: Task[];
  activeTasksCount: number;
  totalComplexityWeight: number;
  acceptedCountThisMonth: number;
  acceptedWeightThisMonth: number;
  overdueCount: number;
}

export interface ProjectHealthSummary {
  projectId: string;
  projectName: string;
  goal: string;
  startDate: string;
  targetDate: string;
  managerId: string | null;
  managerName: string | null;
  isUnmanaged: boolean;
  ragStatus: RagStatus;
  ragReasons: string[];
  totalTasks: number;
  openTasksCount: number;
  overdueTasksCount: number;
  blockedTasksCount: number;
  slipCount: number;
  lastActivityDate: string | null;
  daysSinceLastActivity: number;
}

export interface BlockerCategoryCount {
  category: BlockerCategory;
  label: string;
  activeCount: number;
  avgResolutionDays: number;
}

export interface OrgMetricSummary {
  acceptedThroughput30d: number;
  acceptedWeight30d: number;
  acceptedThroughput6m: number;
  acceptedWeight6m: number;
  totalSubmissions: number;
  totalReturns: number;
  reworkRatePercent: number;
  plannedWeight: number;
  unplannedWeight: number;
  unplannedCapacityPercent: number;
  unassignedTasksCount: number;
  unmanagedProjectsCount: number;
}

export interface OperationalSignalsPayload {
  simulatedDate: string;
  attentionItems: AttentionItem[];
  projectSummaries: ProjectHealthSummary[];
  memberSummaries: Record<string, MemberSignalSummary>;
  orgMetrics: OrgMetricSummary;
  blockerAnalytics: BlockerCategoryCount[];
}
