import { AcceptedDeliverable } from "../../../types/accepteddeliverables";
import { PersonalTask } from "../../../types/memberpersonaltasks";
import { SharedProjectTask } from "../../../types/memberSharedProject";

export const personalTasks: PersonalTask[] = [
  {
    id: 1,
    title: 'Fix Production Token Leak',
    overview:
      'Hotfix for sensitive token leakage in legacy debug log stream.',
    project:
      'Identity & Access Engine (IAM v2)',
    complexity: 'HIGH (3 PTS)',
    dueDate: '2026-09-02',
    overdue: true,
    status: 'IN PROGRESS',
    accessMode: 'SUBMIT',
  },

  {
    id: 2,
    title: 'Integrate WebAuthn Passkeys',
    overview:
      'Implement FIDO2 / WebAuthn protocol for biometric client authentication.',
    project:
      'Identity & Access Engine (IAM v2)',
    complexity: 'HIGH (3 PTS)',
    dueDate: '2026-09-03',
    status: 'IN PROGRESS',
    accessMode: 'SUBMIT',
  },

  {
    id: 3,
    title: 'SDK Sample iOS App',
    overview:
      'SwiftUI sample application illustrating SDK authentication and event capture.',
    project: 'Mobile SDK Onboarding',
    complexity: 'MID (2 PTS)',
    dueDate: '2026-09-30',
    status: 'NOT STARTED',
    accessMode: 'START',
  },

  {
    id: 4,
    title: 'API Documentation Update',
    overview:
      'Update authentication API documentation and developer examples.',
    project: 'Mobile SDK Onboarding',
    complexity: 'LOW (1 PT)',
    dueDate: '2026-10-04',
    status: 'NOT STARTED',
    accessMode: 'START',
  },
];


export const sharedProjectTasks: SharedProjectTask[] = [
  {
    id: 1,
    title: 'SDK Sample iOS App',
    overview:
      'SwiftUI sample application illustrating SDK authentication and event capture.',

    project: 'Mobile SDK Onboarding',

    complexity: 'MID (2 PTS)',

    dueDate: '2026-08-26',

    overdue: true,

    status: 'NOT STARTED',

    accessMode: 'INSPECT (READ-ONLY)',
  },

  {
    id: 2,
    title: 'Schema Migration Script',
    overview:
      'Postgres partitioned table schema migration for event streams.',

    teammate: {
      name: 'Maya Patel',
      initials: 'M',
    },

    project:
      'Data Ingestion & Analytics Pipeline',

    complexity: 'LOW (1 PT)',

    dueDate: '2026-09-04',

    status: 'IN PROGRESS',

    accessMode: 'INSPECT (READ-ONLY)',
  },

  {
    id: 3,
    title: 'ETL Chunking Algorithm',
    overview:
      'Optimize batch window chunking to process 50k rows/sec without...',

    teammate: {
      name: 'Maya Patel',
      initials: 'M',
    },

    project:
      'Data Ingestion & Analytics Pipeline',

    complexity: 'MID (2 PTS)',

    dueDate: '2026-09-08',

    status: 'IN PROGRESS',

    accessMode: 'INSPECT (READ-ONLY)',
  },

  {
    id: 4,
    title: 'External Identity Provider Certs',
    overview:
      'Configure mutual TLS and federated Okta/Azure AD enterprise...',

    teammate: {
      name: 'Maya Patel',
      initials: 'M',
    },

    project:
      'Identity & Access Engine (IAM v2)',

    complexity: 'HIGH (3 PTS)',

    dueDate: '2026-09-10',

    status: 'BLOCKED',

    accessMode: 'INSPECT (READ-ONLY)',
  },
];

export const acceptedDeliverables: AcceptedDeliverable[] = [
  {
    id: 1,
    deliverable:
      'OAuth2 Authorization Server Config',
    project:
      'Identity & Access Engine (IAM v2)',
    complexity: 'HIGH (3 PTS)',
    acceptedOn: '8/18/2026',
  },

  {
    id: 2,
    deliverable:
      'Audit Log DynamoDB Exporter',
    project:
      'Identity & Access Engine (IAM v2)',
    complexity: 'MID (2 PTS)',
    acceptedOn: '8/28/2026',
  },

  {
    id: 3,
    deliverable: 'kjnkl',
    project:
      'Identity & Access Engine (IAM v2)',
    complexity: 'MID (2 PTS)',
    acceptedOn: '9/13/2026',
  },
];