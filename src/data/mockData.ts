// src/data/mockData.ts


// ======================================================
// MANAGER
// ======================================================

export type Manager = {
  id: string;
  name: string;
  role: string;
};


// ======================================================
// DASHBOARD STATISTICS
// ======================================================

export type Stat = {
  label: string;
  value: number;
  description: string;
  icon: string;
  color: "red" | "purple" | "blue" | "green";
};


// ======================================================
// ATTENTION RADAR
// ======================================================

export type AttentionItem = {
  id: number;
  type: "critical" | "warning";
  project: string;
  title: string;
  description: string;
  assignee: string;
  actionLabel: string;
};


// ======================================================
// MANAGERS
// ======================================================

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


// ======================================================
// MANAGER STATISTICS
// ======================================================

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


// ======================================================
// CRITICAL EXCEPTIONS
// ======================================================

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


// ======================================================
// AGING WORK ITEMS
// ======================================================

export const agingWorkItems: AttentionItem[] = [
  {
    id: 2,

    type: "warning",

    project: "Identity & Access Engine (IAM v2)",

    title:
      "Aging Blocker (Third-Party Vendor / External): External Identity Provider Certs",

    description:
      'Blocker raised 4 working days ago assigned to resolve David Kim: "Awaiting vendor signing certificates and production Okta sandbox provision."',

    assignee: "MAYA PATEL",

    actionLabel: "Inspect",
  },

  {
    id: 3,

    type: "warning",

    project: "Data Ingestion & Analytics Pipeline",

    title:
      "Aging WIP (MID Complexity): ETL Chunking Algorithm",

    description:
      "In progress for 8 working days (threshold: 6 days). May be blocked or under-scoped.",

    assignee: "MAYA PATEL",

    actionLabel: "Inspect",
  },
];


// ======================================================
// MANAGER ACCEPTANCE GATE
// ======================================================

export type AcceptanceItem = {
  id: number;

  deliverable: string;

  description: string;

  project: string;

  submittedBy: string;

  complexity: "LOW" | "MID" | "HIGH";

  points: number;

  status: "AWAITING VERIFICATION";
};


// ======================================================
// ACCEPTANCE GATE DATA
// ======================================================

export const acceptanceItems: AcceptanceItem[] = [
  {
    id: 1,

    deliverable: "Role-Based Route Guards",

    description:
      "Client-side permission router gates matching backend permission claims.",

    project: "Identity & Access Engine (IAM v2)",

    submittedBy: "Alex Chen",

    complexity: "LOW",

    points: 1,

    status: "AWAITING VERIFICATION",
  },
];


// ======================================================
// TEAM CAPACITY
// ======================================================

export type TeamMember = {
  id: number;

  name: string;

  role: string;

  points: number;

  activeTasks: number;

  overdue: number;

  onLeave?: boolean;

  capacityPercentage: number;
};


// ======================================================
// TEAM MEMBERS
// ======================================================

export const teamMembers: TeamMember[] = [
  {
    id: 1,

    name: "Alex Chen",

    role: "Senior Software Engineer",

    points: 9,

    activeTasks: 4,

    overdue: 1,

    capacityPercentage: 100,
  },

  {
    id: 2,

    name: "Maya Patel",

    role: "Data & Backend Engineer",

    points: 6,

    activeTasks: 3,

    overdue: 0,

    onLeave: true,

    capacityPercentage: 75,
  },
];


// ======================================================
// AUDIT LEDGER
// ======================================================

export type AuditEvent = {
  id: number;

  timestamp: string;

  actor: string;

  eventType:
    | "SUBMITTED TO GATE"
    | "TASK CREATED"
    | "DELIVERABLE ACCEPTED"
    | "STATUS CHANGED";

  transition: string;

  note: string;
};


// ======================================================
// AUDIT EVENTS
// ======================================================

export const auditEvents: AuditEvent[] = [
  {
    id: 1,

    timestamp: "05:30:00 PM",

    actor: "Alex Chen",

    eventType: "SUBMITTED TO GATE",

    transition: "in_progress → submitted",

    note: "PR #104 ready with test suite coverage",
  },

  {
    id: 2,

    timestamp: "12:00:00 PM",

    actor: "Alex Chen",

    eventType: "TASK CREATED",

    transition: "Fix Production Token Leak",

    note: "High-severity production triage",
  },

  {
    id: 3,

    timestamp: "05:00:00 PM",

    actor: "David Kim",

    eventType: "DELIVERABLE ACCEPTED",

    transition: "submitted → accepted",

    note: "Verified export batching and retention locks",
  },

  {
    id: 4,

    timestamp: "11:05:00 AM",

    actor: "Maya Patel",

    eventType: "STATUS CHANGED",

    transition: "in_progress → blocked",

    note: "Blocked by external cert vendor",
  },
];