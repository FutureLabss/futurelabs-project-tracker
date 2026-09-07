// Alex Chen task fixtures from project-track-demo/src/domain/seed/initial-dataset.ts.
export const personalTasks = [
  {
    "id": "task-1",
    "title": "Implement SMS 2FA Fallback",
    "description": "Provide secure SMS one-time passcode fallback when TOTP / authenticator is inaccessible.",
    "project": "Identity & Access Engine (IAM v2)",
    "status": "in_progress",
    "complexity": "mid",
    "dueDate": "2026-08-25",
    "acceptedAt": null
  },
  {
    "id": "task-2",
    "title": "Integrate WebAuthn Passkeys",
    "description": "Implement FIDO2 / WebAuthn protocol for biometric client authentication.",
    "project": "Identity & Access Engine (IAM v2)",
    "status": "not_started",
    "complexity": "high",
    "dueDate": "2026-09-03",
    "acceptedAt": null
  },
  {
    "id": "task-5",
    "title": "Role-Based Route Guards",
    "description": "Client-side permission router gates matching backend permission claims.",
    "project": "Identity & Access Engine (IAM v2)",
    "status": "submitted",
    "complexity": "low",
    "dueDate": "2026-09-02",
    "acceptedAt": null
  },
  {
    "id": "task-6",
    "title": "Fix Production Token Leak",
    "description": "Hotfix for sensitive token leakage in legacy debug log stream.",
    "project": "Identity & Access Engine (IAM v2)",
    "status": "in_progress",
    "complexity": "high",
    "dueDate": "2026-09-02",
    "acceptedAt": null
  },
  {
    "id": "task-hist-1",
    "title": "OAuth2 Authorization Server Config",
    "description": "Configure authorization server grant types and refresh rotation.",
    "project": "Identity & Access Engine (IAM v2)",
    "status": "accepted",
    "complexity": "high",
    "dueDate": "2026-08-18",
    "acceptedAt": "2026-08-18T10:00:00Z"
  },
  {
    "id": "task-hist-3",
    "title": "Audit Log DynamoDB Exporter",
    "description": "Stream security events to immutable cold storage.",
    "project": "Identity & Access Engine (IAM v2)",
    "status": "accepted",
    "complexity": "mid",
    "dueDate": "2026-08-28",
    "acceptedAt": "2026-08-28T16:00:00Z"
  }
];
