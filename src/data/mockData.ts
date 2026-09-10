// src/data/mockData.ts

export type Manager = {
  id: string;
  name: string;
  role: string;
};

export type Stat = {
  label: string;
  value: number;
  description: string;
  icon: string;
  color: "red" | "purple" | "blue" | "green";
};

export type AttentionItem = {
  id: number;
  type: "critical" | "warning";
  project: string;
  title: string;
  description: string;
  assignee: string;
  actionLabel: string;
};

export const managers: Manager[] = [
  {
    id: "david-kim",
    name: "David Kim",
    role: "MANAGER",
  },
  {
    id: "maya-patel",
    name: "Maya Patel",
    role: "MANAGER",
  },
];

export const managerStats: Stat[] = [
  {
    label: "CRITICAL EXCEPTIONS",
    value: 1,
    description: "Silent overruns & stalled work",
    icon: "flame",
    color: "red",
  },
  {
    label: "REVIEW GATE SUBMISSIONS",
    value: 1,
    description: "Awaiting manager sign-off",
    icon: "clipboard",
    color: "purple",
  },
  {
    label: "ACTIVE PROJECTS",
    value: 4,
    description: "Managed portfolio",
    icon: "folder",
    color: "blue",
  },
  {
    label: "TEAM ENGINEERS",
    value: 2,
    description: "Active contributors",
    icon: "users",
    color: "green",
  },
];

export const criticalExceptions: AttentionItem[] = [
  {
    id: 1,
    type: "critical",
    project: "Mobile SDK Onboarding",
    title: "Silent Overrun: SDK Sample iOS App",
    description:
      "Overdue by 4 working day(s) with 16 working day(s) of complete inactivity. Immediate attention required.",
    assignee: "UNASSIGNED",
    actionLabel: "Inspect Silent Overrun",
  },
];

export const agingWorkItems: AttentionItem[] = [
  {
    id: 2,
    type: "warning",
    project: "Identity & Access Engine (IAM v2)",
    title: "Aging Blocker (Third-Party Vendor / External): External Identity Provider Certs",
    description:
      'Blocker raised 4 working days ago assigned to resolve David Kim: "Awaiting vendor signing certificates and production Okta sandbox provision."',
    assignee: "MAYA PATEL",
    actionLabel: "Inspect",
  },
  {
    id: 3,
    type: "warning",
    project: "Data Ingestion & Analytics Pipeline",
    title: "Aging WIP (MID Complexity): ETL Chunking Algorithm",
    description:
      "In progress for 8 working days (threshold: 6 days). May be blocked or under-scoped.",
    assignee: "MAYA PATEL",
    actionLabel: "Inspect",
  },
];