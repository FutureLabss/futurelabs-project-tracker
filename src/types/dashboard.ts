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

export type DashboardTone =
  "teal" | "blue" | "orange" | "red" | "violet" | "gray";

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
