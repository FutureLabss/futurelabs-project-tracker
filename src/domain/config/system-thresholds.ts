import { TaskComplexity } from "../../entities/task.entity";

export const SYSTEM_CONFIG = {
  BASE_SIMULATED_DATE: "2026-09-01", // Tuesday

  COMPLEXITY_WEIGHTS: {
    low: 1,
    mid: 2,
    high: 3,
  } as Record<TaskComplexity, number>,

  AGING_WIP_WORKING_DAYS: {
    low: 3,
    mid: 6,
    high: 10,
  } as Record<TaskComplexity, number>,

  STALE_INACTIVITY_WORKING_DAYS: 5,
  AGING_BLOCKER_WORKING_DAYS: 3,
  IMMINENT_WARNING_WORKING_DAYS: 3,
  SLIP_ALERT_COUNT_THRESHOLD: 2,

  CATEGORY_LABELS: {
    person: "People / Cross-Team",
    external: "Third-Party Vendor / External",
    decision: "Architectural / Lead Decision",
    unclear_requirement: "Unclear Scope / Specs",
  } as const,
};
