import { Person } from "../../entities/person.entity";
import { Project } from "../../entities/project.entity";
import { Task } from "../../entities/task.entity";
import { Blocker } from "../../entities/blocker.entity";
import { Availability } from "../../entities/availability.entity";
import { LedgerRecord } from "../../entities/ledger-record.entity";

export interface SeedData {
  persons: Person[];
  projects: Project[];
  tasks: Task[];
  blockers: Blocker[];
  availabilities: Availability[];
  ledger: LedgerRecord[];
}

export const INITIAL_PERSONS: Person[] = [
  {
    id: "p-alex",
    name: "Alex Chen",
    email: "alex.chen@futurelabs.io",
    role: "member",
    title: "Senior Software Engineer",
  },
  {
    id: "p-maya",
    name: "Maya Patel",
    email: "maya.patel@futurelabs.io",
    role: "member",
    title: "Data & Backend Engineer",
  },
  {
    id: "p-david",
    name: "David Kim",
    email: "david.kim@futurelabs.io",
    role: "manager",
    title: "Engineering Team Lead",
  },
  {
    id: "p-sarah",
    name: "Sarah Connor",
    email: "sarah.connor@futurelabs.io",
    role: "admin",
    title: "VP of Engineering",
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-iam",
    name: "Identity & Access Engine (IAM v2)",
    goal: "Zero-trust authentication, passkey support, and robust 2FA fallback mechanisms.",
    startDate: "2026-08-01",
    targetDate: "2026-09-15",
    managerId: "p-david",
    state: "active",
    createdAt: "2026-08-01T09:00:00Z",
  },
  {
    id: "proj-data",
    name: "Data Ingestion & Analytics Pipeline",
    goal: "High-throughput ETL processing engine with dynamic schema migrations.",
    startDate: "2026-08-10",
    targetDate: "2026-09-30",
    managerId: "p-david",
    state: "active",
    createdAt: "2026-08-10T09:00:00Z",
  },
  {
    id: "proj-mobile",
    name: "Mobile SDK Onboarding",
    goal: "Cross-platform SDK wrappers and onboarding sample apps for partners.",
    startDate: "2026-08-01",
    targetDate: "2026-08-28", // Past target delivery date with open tasks -> RED RAG
    managerId: null, // Unmanaged project
    state: "active",
    createdAt: "2026-08-01T10:00:00Z",
  },
];

export const INITIAL_AVAILABILITIES: Availability[] = [
  {
    id: "avail-maya-1",
    personId: "p-maya",
    fromDate: "2026-08-27",
    toDate: "2026-08-31",
    note: "Approved Annual Leave",
  },
];

export const INITIAL_TASKS: Task[] = [
  // Scenario 1: Silent Overrun (Alex)
  {
    id: "task-1",
    projectId: "proj-iam",
    title: "Implement SMS 2FA Fallback",
    description:
      "Provide secure SMS one-time passcode fallback when TOTP / authenticator is inaccessible.",
    assigneeId: "p-alex",
    status: "in_progress",
    complexity: "mid",
    origin: "planned",
    dueDate: "2026-08-25",
    submittedAt: null,
    acceptedAt: null,
    acceptedBy: null,
    activeBlockerId: null,
    createdAt: "2026-08-12T09:00:00Z",
  },

  // Scenario 2: IC Imminent Warning (Alex)
  {
    id: "task-2",
    projectId: "proj-iam",
    title: "Integrate WebAuthn Passkeys",
    description:
      "Implement FIDO2 / WebAuthn protocol for biometric client authentication.",
    assigneeId: "p-alex",
    status: "not_started",
    complexity: "high",
    origin: "planned",
    dueDate: "2026-09-03", // 2 working days from 2026-09-01
    submittedAt: null,
    acceptedAt: null,
    acceptedBy: null,
    activeBlockerId: null,
    createdAt: "2026-08-15T10:00:00Z",
  },

  // Scenario 3: Systemic Aging Blocker (Maya)
  {
    id: "task-3",
    projectId: "proj-iam",
    title: "External Identity Provider Certs",
    description:
      "Configure mutual TLS and federated Okta/Azure AD enterprise certificates.",
    assigneeId: "p-maya",
    status: "blocked",
    complexity: "high",
    origin: "planned",
    dueDate: "2026-09-10",
    submittedAt: null,
    acceptedAt: null,
    acceptedBy: null,
    activeBlockerId: "blocker-1",
    createdAt: "2026-08-18T11:00:00Z",
  },

  // Scenario 4: Aging WIP (Maya)
  {
    id: "task-4",
    projectId: "proj-data",
    title: "ETL Chunking Algorithm",
    description:
      "Optimize batch window chunking to process 50k rows/sec without heap bloat.",
    assigneeId: "p-maya",
    status: "in_progress",
    complexity: "mid", // Mid threshold is 6 days; started 8 working days ago on 2026-08-20
    origin: "planned",
    dueDate: "2026-09-08",
    submittedAt: null,
    acceptedAt: null,
    acceptedBy: null,
    activeBlockerId: null,
    createdAt: "2026-08-18T09:00:00Z",
  },

  // Scenario 5: Acceptance Gate Queue (Alex)
  {
    id: "task-5",
    projectId: "proj-iam",
    title: "Role-Based Route Guards",
    description:
      "Client-side permission router gates matching backend permission claims.",
    assigneeId: "p-alex",
    status: "submitted",
    complexity: "low",
    origin: "planned",
    dueDate: "2026-09-02",
    submittedAt: "2026-08-31T16:30:00Z",
    acceptedAt: null,
    acceptedBy: null,
    activeBlockerId: null,
    deliverableUrl: "https://github.com/futurelabs/iam-engine/pull/104",
    submissionNotes:
      "PR #104 ready with test suite coverage and permission matrix verification.",
    createdAt: "2026-08-22T09:00:00Z",
  },

  // Scenario 6: Unplanned Work (Alex)
  {
    id: "task-6",
    projectId: "proj-iam",
    title: "Fix Production Token Leak",
    description:
      "Hotfix for sensitive token leakage in legacy debug log stream.",
    assigneeId: "p-alex",
    status: "in_progress",
    complexity: "high",
    origin: "unplanned",
    dueDate: "2026-09-02",
    submittedAt: null,
    acceptedAt: null,
    acceptedBy: null,
    activeBlockerId: null,
    createdAt: "2026-08-31T11:00:00Z",
  },

  // Scenario 7: Leave Suppression (Maya)
  {
    id: "task-7",
    projectId: "proj-data",
    title: "Schema Migration Script",
    description:
      "Postgres partitioned table schema migration for event streams.",
    assigneeId: "p-maya",
    status: "in_progress",
    complexity: "low",
    origin: "planned",
    dueDate: "2026-09-04",
    submittedAt: null,
    acceptedAt: null,
    acceptedBy: null,
    activeBlockerId: null,
    createdAt: "2026-08-25T14:00:00Z",
  },

  // Scenario 8: Unowned Task in Unmanaged Project
  {
    id: "task-8",
    projectId: "proj-mobile",
    title: "SDK Sample iOS App",
    description:
      "SwiftUI sample application illustrating SDK authentication and event capture.",
    assigneeId: null,
    status: "not_started",
    complexity: "mid",
    origin: "planned",
    dueDate: "2026-08-26", // Overdue
    submittedAt: null,
    acceptedAt: null,
    acceptedBy: null,
    activeBlockerId: null,
    createdAt: "2026-08-10T10:00:00Z",
  },

  // Additional Completed & Historical Tasks to support Org Analytics
  {
    id: "task-hist-1",
    projectId: "proj-iam",
    title: "OAuth2 Authorization Server Config",
    description:
      "Configure authorization server grant types and refresh rotation.",
    assigneeId: "p-alex",
    status: "accepted",
    complexity: "high",
    origin: "planned",
    dueDate: "2026-08-18",
    submittedAt: "2026-08-17T15:00:00Z",
    acceptedAt: "2026-08-18T10:00:00Z",
    acceptedBy: "p-david",
    activeBlockerId: null,
    deliverableUrl: "https://github.com/futurelabs/iam-engine/pull/98",
    submissionNotes:
      "OAuth2 authorization server compliance tests passing with 98% branch coverage.",
    createdAt: "2026-08-05T09:00:00Z",
  },
  {
    id: "task-hist-2",
    projectId: "proj-data",
    title: "Kafka Consumer Ingestion Worker",
    description: "Distributed event consumer for streaming clickstream data.",
    assigneeId: "p-maya",
    status: "accepted",
    complexity: "high",
    origin: "planned",
    dueDate: "2026-08-22",
    submittedAt: "2026-08-21T14:00:00Z",
    acceptedAt: "2026-08-22T09:30:00Z",
    acceptedBy: "p-david",
    activeBlockerId: null,
    deliverableUrl: "https://github.com/futurelabs/data-pipeline/pull/44",
    submissionNotes:
      "Benchmark tests verified 50k events/sec throughput with consumer group failover.",
    createdAt: "2026-08-08T09:00:00Z",
  },
  {
    id: "task-hist-3",
    projectId: "proj-iam",
    title: "Audit Log DynamoDB Exporter",
    description: "Stream security events to immutable cold storage.",
    assigneeId: "p-alex",
    status: "accepted",
    complexity: "mid",
    origin: "planned",
    dueDate: "2026-08-28",
    submittedAt: "2026-08-28T12:00:00Z",
    acceptedAt: "2026-08-28T16:00:00Z",
    acceptedBy: "p-david",
    activeBlockerId: null,
    deliverableUrl: "https://github.com/futurelabs/iam-engine/pull/101",
    submissionNotes:
      "DynamoDB continuous backup integration verified with encrypted partition keys.",
    createdAt: "2026-08-15T09:00:00Z",
  },
];

export const INITIAL_BLOCKERS: Blocker[] = [
  {
    id: "blocker-1",
    taskId: "task-3",
    category: "external",
    description:
      "Awaiting vendor signing certificates and production Okta sandbox provision.",
    ownerId: "p-david",
    raisedAt: "2026-08-26T10:00:00Z", // 4 working days ago from 2026-09-01
    clearedAt: null,
    clearedBy: null,
  },
  {
    id: "blocker-resolved-1",
    taskId: "task-hist-2",
    category: "decision",
    description:
      "Clarify Kafka partition key schema strategy with architectural board.",
    ownerId: "p-david",
    raisedAt: "2026-08-12T10:00:00Z",
    clearedAt: "2026-08-14T15:00:00Z",
    clearedBy: "p-david",
  },
];

export const INITIAL_LEDGER: LedgerRecord[] = [
  {
    id: "l-1",
    subjectId: "proj-iam",
    subjectType: "project",
    actorId: "p-sarah",
    type: "project_created",
    fromValue: null,
    toValue: "Identity & Access Engine (IAM v2)",
    reason: "Initial roadmap kick-off",
    occurredAt: "2026-08-01T09:00:00Z",
  },
  {
    id: "l-2",
    subjectId: "task-1",
    subjectType: "task",
    actorId: "p-david",
    type: "task_created",
    fromValue: null,
    toValue: "Implement SMS 2FA Fallback",
    reason: null,
    occurredAt: "2026-08-12T09:00:00Z",
  },
  {
    id: "l-3",
    subjectId: "task-1",
    subjectType: "task",
    actorId: "p-alex",
    type: "status_changed",
    fromValue: "not_started",
    toValue: "in_progress",
    reason: null,
    occurredAt: "2026-08-18T10:00:00Z",
  },
  {
    id: "l-4",
    subjectId: "task-1",
    subjectType: "task",
    actorId: "p-alex",
    type: "task_redated",
    fromValue: "2026-08-22",
    toValue: "2026-08-25",
    reason:
      "Twilio webhook provider API rate limit investigation required extra time",
    occurredAt: "2026-08-20T11:00:00Z",
  },
  {
    id: "l-5",
    subjectId: "task-1",
    subjectType: "task",
    actorId: "p-alex",
    type: "task_redated",
    fromValue: "2026-08-25",
    toValue: "2026-08-25",
    reason: "Finalized carrier failover test cases",
    occurredAt: "2026-08-24T16:00:00Z", // Last activity for task-1
  },
  {
    id: "l-6",
    subjectId: "task-4",
    subjectType: "task",
    actorId: "p-maya",
    type: "status_changed",
    fromValue: "not_started",
    toValue: "in_progress",
    reason: null,
    occurredAt: "2026-08-20T09:00:00Z", // In progress since Aug 20 (8 working days)
  },
  {
    id: "l-7",
    subjectId: "blocker-1",
    subjectType: "blocker",
    actorId: "p-maya",
    type: "blocker_raised",
    fromValue: null,
    toValue: "external",
    reason: "Awaiting vendor signing certificates",
    occurredAt: "2026-08-26T10:00:00Z",
  },
  {
    id: "l-8",
    subjectId: "task-3",
    subjectType: "task",
    actorId: "p-maya",
    type: "status_changed",
    fromValue: "in_progress",
    toValue: "blocked",
    reason: "Blocked by external cert vendor",
    occurredAt: "2026-08-26T10:05:00Z",
  },
  {
    id: "l-9",
    subjectId: "task-5",
    subjectType: "task",
    actorId: "p-alex",
    type: "task_submitted",
    fromValue: "in_progress",
    toValue: "submitted",
    reason: "PR #104 ready with test suite coverage",
    occurredAt: "2026-08-31T16:30:00Z",
  },
  {
    id: "l-10",
    subjectId: "task-6",
    subjectType: "task",
    actorId: "p-alex",
    type: "task_created",
    fromValue: null,
    toValue: "Fix Production Token Leak",
    reason: "High-severity production triage",
    occurredAt: "2026-08-31T11:00:00Z",
  },
  {
    id: "l-11",
    subjectId: "avail-maya-1",
    subjectType: "availability",
    actorId: "p-maya",
    type: "leave_recorded",
    fromValue: null,
    toValue: "2026-08-27 to 2026-08-31",
    reason: "Approved Annual Leave",
    occurredAt: "2026-08-25T17:00:00Z",
  },
  {
    id: "l-12",
    subjectId: "task-hist-1",
    subjectType: "task",
    actorId: "p-david",
    type: "task_accepted",
    fromValue: "submitted",
    toValue: "accepted",
    reason: "RFC compliance and security audits passed",
    occurredAt: "2026-08-18T10:00:00Z",
  },
  {
    id: "l-13",
    subjectId: "task-hist-2",
    subjectType: "task",
    actorId: "p-david",
    type: "task_accepted",
    fromValue: "submitted",
    toValue: "accepted",
    reason: "Benchmark throughput targets verified",
    occurredAt: "2026-08-22T09:30:00Z",
  },
  {
    id: "l-14",
    subjectId: "task-hist-3",
    subjectType: "task",
    actorId: "p-david",
    type: "task_accepted",
    fromValue: "submitted",
    toValue: "accepted",
    reason: "Verified export batching and retention locks",
    occurredAt: "2026-08-28T16:00:00Z",
  },
  {
    id: "l-15",
    subjectId: "task-hist-1",
    subjectType: "task",
    actorId: "p-david",
    type: "task_returned",
    fromValue: "submitted",
    toValue: "in_progress",
    reason: "Token refresh rotation edge case failed unit tests",
    occurredAt: "2026-08-16T14:00:00Z",
  },
  {
    id: "l-16",
    subjectId: "task-hist-1",
    subjectType: "task",
    actorId: "p-alex",
    type: "task_submitted",
    fromValue: "in_progress",
    toValue: "submitted",
    reason: "Fixed token refresh race condition",
    occurredAt: "2026-08-17T15:00:00Z",
  },
];

export function getInitialSeedDataset(): SeedData {
  return {
    persons: JSON.parse(JSON.stringify(INITIAL_PERSONS)),
    projects: JSON.parse(JSON.stringify(INITIAL_PROJECTS)),
    tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
    blockers: JSON.parse(JSON.stringify(INITIAL_BLOCKERS)),
    availabilities: JSON.parse(JSON.stringify(INITIAL_AVAILABILITIES)),
    ledger: JSON.parse(JSON.stringify(INITIAL_LEDGER)),
  };
}
