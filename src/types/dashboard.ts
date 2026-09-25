import { TablerIcon } from "@tabler/icons-react";

export type UserRole = "member" | "manager" | "admin";

export type AdminView =
  | "portfolio"
  | "analytics"
  | "governance"
  | "risks"
  | "tasks"
  | "people"
  | "ledger";

export type MemberView = "my-work" | "team" | "completed";
export type ManagerView =
  "overview" | "review_gate" | "workload" | "risk_queue";

export type DashboardTone =
  "teal" | "blue" | "orange" | "red" | "violet" | "gray";

export type TaskComplexity = "LOW" | "MID" | "HIGH";

export type TaskOrigin = "PLANNED" | "UNPLANNED";

export interface Persona {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  title: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  trend: string;
  tone: Exclude<DashboardTone, "gray">;
}

export interface DashboardAction {
  label: string;
  icon: TablerIcon;
}

export interface DashboardNavigationItem {
  adminView?: AdminView;
  memberView?: MemberView;
  managerView?: ManagerView;
  label: string;
  icon: TablerIcon;
  active?: boolean;
}

export interface DashboardWorkItem {
  title: string;
  meta: string;
  status: string;
  tone: DashboardTone;
}

export interface DashboardPanel {
  title: string;
  description: string;
  items: DashboardWorkItem[];
}

export interface DashboardLayoutConfig {
  role: UserRole;
  roleLabel: string;
  title: string;
  subtitle: string;
  navigation: DashboardNavigationItem[];
  metrics: DashboardMetric[];
  primaryActions: DashboardAction[];
  focusPanel: DashboardPanel;
  secondaryPanel: DashboardPanel;
}

export interface ScheduleSlip {
  id: string;
  oldDate: string;
  newDate: string;
  reason: string;
  author: string;
  timestamp: string;
}

export interface ReviewGateDecision {
  id: string;
  status: "ACCEPTED" | "RETURNED FOR REWORK";
  timestamp: string;
  reviewer: string;
  rationale: string;
}

export interface DeliverableArtifact {
  url: string;
  notes: string;
  decisions: ReviewGateDecision[];
}

export interface LifecycleEvent {
  id: string;
  type:
    | "init"
    | "reschedule"
    | "submit"
    | "blocked"
    | "unblocked"
    | "accepted"
    | "rework";
  title: string;
  author: string;
  timestamp: string;
  transition?: string;
  note?: string;
}

export interface LeaveRecord {
  id: string;
  member: string;
  fromDate: string;
  toDate: string;
  reason: string;
  createdAt: string;
}

export type ManagerNavView = ManagerView;

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "submitted"
  | "accepted"
  | "cancelled";

export interface ManagerTask {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  assigneeId?: string;
  assigneeName?: string;
  status: TaskStatus;
  complexity: TaskComplexity;
  dueDate: string;
  submittedAt?: string;
  acceptedAt?: string;
}

export interface LedgerItem {
  id: string;
  occurredAt: string;
  actorId: string;
  actorName: string;
  type: string;
  subjectTitle: string;
  fromStatus?: string;
  toStatus?: string;
  justification: string;
}

export interface RiskSignal {
  id: string;
  headline: string;
  details: string;
  projectName: string;
  assigneeName: string;
  severity: "critical" | "warning" | "normal";
  signalType:
    | "silent_overrun"
    | "aging_blocker"
    | "aging_wip"
    | "stale_inactivity"
    | "overdue"
    | "imminent_unstarted"
    | "unowned_task"
    | "unmanaged_project";
}

export interface ManagerWorkspaceData {
  metrics: {
    reviewQueueCount: number;
    activeBlockersCount: number;
    teamCapacityPercent: number;
    agingWipCount: number;
    silentOverrunsPinned: number;
  };
  tasks: ManagerTask[];
  reviewQueue: ManagerTask[];
  ledger: LedgerItem[];
  risks: RiskSignal[];
  people: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
}
