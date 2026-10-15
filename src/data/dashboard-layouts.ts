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
  IconFolder,
  IconListDetails,
  IconTrophy,
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
      {
        label: "Team overview",
        icon: IconLayoutDashboard,
        managerView: "overview",
        active: true,
      },
      { label: "My Work", icon: IconUser, managerView: "my_work" },
      {
        label: "Review gate",
        icon: IconClipboardCheck,
        managerView: "review_gate",
      },
      { label: "Projects", icon: IconFolder, managerView: "projects" },
      { label: "Tasks", icon: IconListDetails, managerView: "tasks" },
      { label: "Workload", icon: IconUsers, managerView: "workload" },
      {
        label: "Risk queue",
        icon: IconAlertTriangle,
        managerView: "risk_queue",
      },
      { label: "Change feed", icon: IconHistory, managerView: "change_feed" },
      { label: "History", icon: IconTrophy, managerView: "history" },
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
      { label: "Analytics", icon: IconChartBar, adminView: "analytics" },
      { label: "Governance", icon: IconShieldCheck, adminView: "governance" },
      { label: "Risks", icon: IconAlertTriangle, adminView: "risks" },
      { label: "Tasks", icon: IconClipboardCheck, adminView: "tasks" },
      { label: "Team", icon: IconUsers, adminView: "people" },
      { label: "Activity", icon: IconHistory, adminView: "ledger" },
    ],
    metrics: [],
    primaryActions: [],
    focusPanel: { title: "", description: "", items: [] },
    secondaryPanel: { title: "", description: "", items: [] },
  },
};
