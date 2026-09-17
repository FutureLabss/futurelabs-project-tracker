import {
  IconAlertTriangle,
  IconChartBar,
  IconClipboardCheck,
  IconLayoutDashboard,
  IconReportAnalytics,
  IconShieldCheck,
  IconUsers,
  IconUser,
  IconHistory,
} from "@tabler/icons-react";
import { DashboardLayoutConfig, UserRole } from "../types/dashboard";

export const roleDashboards: Record<UserRole, DashboardLayoutConfig> = {
  member: {
    role: "member",
    roleLabel: "Member",
    title: "",
    subtitle: "",
    navigation: [
      {
        label: "Projects",
        icon: IconUser,
        memberView: "my-work",
        active: true,
      },
      { label: "Tasks", icon: IconUsers, memberView: "team" },
      { label: "History", icon: IconHistory, memberView: "completed" },
    ],
    metrics: [],
    primaryActions: [],
    focusPanel: {
      title: "",
      description: "",
      items: [],
    },
    secondaryPanel: {
      title: "",
      description: "",
      items: [],
    },
  },
  manager: {
    role: "manager",
    roleLabel: "Manager",
    title: "Team delivery command",
    subtitle:
      "Review submitted work, rebalance load, and remove delivery blockers.",
    navigation: [
      { label: "Team overview", icon: IconLayoutDashboard, active: true },
      { label: "Review gate", icon: IconClipboardCheck },
      { label: "Workload", icon: IconUsers },
      { label: "Risk queue", icon: IconAlertTriangle },
    ],
    metrics: [],
    primaryActions: [
      { label: "Review submissions", icon: IconClipboardCheck },
      { label: "Assign work", icon: IconUsers },
    ],
    focusPanel: {
      title: "",
      description: "",
      items: [],
    },
    secondaryPanel: {
      title: "",
      description: "",
      items: [],
    },
  },
  admin: {
    role: "admin",
    roleLabel: "Admin",
    title: "Portfolio operations",
    subtitle: "",
    navigation: [
      {
        label: "Portfolio",
        icon: IconReportAnalytics,
        adminView: "portfolio",
        active: true,
      },
      { label: "Health analytics", icon: IconChartBar, adminView: "analytics" },
      { label: "Governance", icon: IconShieldCheck, adminView: "governance" },
      { label: "Org risks", icon: IconAlertTriangle, adminView: "risks" },
      { label: "All tasks", icon: IconClipboardCheck, adminView: "tasks" },
      { label: "Team directory", icon: IconUsers, adminView: "people" },
      { label: "Activity ledger", icon: IconHistory, adminView: "ledger" },
    ],
    metrics: [],
    primaryActions: [],
    focusPanel: { title: "", description: "", items: [] },
    secondaryPanel: { title: "", description: "", items: [] },
  },
};
