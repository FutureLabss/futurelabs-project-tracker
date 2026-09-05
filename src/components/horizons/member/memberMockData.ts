export type TaskComplexity = "LOW" | "MID" | "HIGH";

export type TaskStatus = "NOT STARTED" | "IN PROGRESS" | "BLOCKED";

export interface MemberTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeInitial?: string;
  assigneeRole?: string;
  project: string;
  complexity: TaskComplexity;
  points: number;
  dueDate: string;
  status: TaskStatus;
  overdue: boolean;
  accessMode: "INSPECT (READ-ONLY)";
}

export const memberTasks: MemberTask[] = [
  {
    id: "1",
    title: "SDK Sample iOS App",
    description:
      "SwiftUI sample application illustrating SDK authentication and event capture.",
    assignee: "UNASSIGNED",
    project: "Mobile SDK Onboarding",
    complexity: "MID",
    points: 2,
    dueDate: "2026-08-26",
    status: "NOT STARTED",
    overdue: true,
    accessMode: "INSPECT (READ-ONLY)",
  },
  {
    id: "2",
    title: "Schema Migration Script",
    description:
      "Postgres partitioned table schema migration for event streams.",
    assignee: "Maya Patel",
    assigneeInitial: "M",
    assigneeRole: "member",
    project: "Data Ingestion & Analytics Pipeline",
    complexity: "LOW",
    points: 1,
    dueDate: "2026-09-04",
    status: "IN PROGRESS",
    overdue: true,
    accessMode: "INSPECT (READ-ONLY)",
  },
  {
    id: "3",
    title: "ETL Chunking Algorithm",
    description:
      "Optimize batch window chunking to process 50k rows/sec without heap bloat.",
    assignee: "Maya Patel",
    assigneeInitial: "M",
    assigneeRole: "member",
    project: "Data Ingestion & Analytics Pipeline",
    complexity: "MID",
    points: 2,
    dueDate: "2026-09-08",
    status: "IN PROGRESS",
    overdue: true,
    accessMode: "INSPECT (READ-ONLY)",
  },
  {
    id: "4",
    title: "External Identity Provider Certs",
    description:
      "Configure mutual TLS and federated Okta/Azure AD enterprise certificates.",
    assignee: "Maya Patel",
    assigneeInitial: "M",
    assigneeRole: "member",
    project: "Identity & Access Engine (IAM v2)",
    complexity: "HIGH",
    points: 3,
    dueDate: "2026-09-10",
    status: "BLOCKED",
    overdue: true,
    accessMode: "INSPECT (READ-ONLY)",
  },
];