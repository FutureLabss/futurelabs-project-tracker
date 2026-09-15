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
      { label: "Work", icon: IconUser, memberView: "my-work", active: true },
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
    metrics: [
      {
        label: "Review queue",
        value: "3",
        trend: "Oldest waiting 2 days",
        tone: "violet",
      },
      {
        label: "Active blockers",
        value: "4",
        trend: "2 need owner action",
        tone: "orange",
      },
      {
        label: "Team capacity",
        value: "82%",
        trend: "Balanced across 5 members",
        tone: "teal",
      },
      {
        label: "Aging WIP",
        value: "5",
        trend: "Past complexity threshold",
        tone: "red",
      },
    ],
    primaryActions: [
      { label: "Review submissions", icon: IconClipboardCheck },
      { label: "Assign work", icon: IconUsers },
    ],
    focusPanel: {
      title: "Manager attention",
      description:
        "Team items that need facilitation, review, or assignment decisions.",
      items: [
        {
          title: "External Identity Provider Certs",
          meta: "Maya Patel - Blocked 4 working days",
          status: "Escalate",
          tone: "red",
        },
        {
          title: "ETL Chunking Algorithm",
          meta: "Maya Patel - In progress 8 working days",
          status: "Coach",
          tone: "orange",
        },
        {
          title: "Role-Based Route Guards",
          meta: "Alex Chen - Submitted",
          status: "Review",
          tone: "violet",
        },
      ],
    },
    secondaryPanel: {
      title: "Team load",
      description: "Capacity and risk snapshot across active contributors.",
      items: [
        {
          title: "Alex Chen",
          meta: "4 open tasks - 1 unplanned",
          status: "High load",
          tone: "orange",
        },
        {
          title: "Maya Patel",
          meta: "3 open tasks - 1 blocked",
          status: "Needs help",
          tone: "red",
        },
      ],
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
