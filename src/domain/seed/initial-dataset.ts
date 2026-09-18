import type { Availability } from "../../entities/availability.entity";
import type { Blocker } from "../../entities/blocker.entity";
import type { LedgerRecord } from "../../entities/ledger-record.entity";
import type { Person } from "../../entities/person.entity";
import type { Project } from "../../entities/project.entity";
import type { Task } from "../../entities/task.entity";

export interface SeedData {
  persons: Person[];
  projects: Project[];
  tasks: Task[];
  blockers: Blocker[];
  availabilities: Availability[];
  ledger: LedgerRecord[];
}

// Local mode keeps only its sign-in identities. Operational collections start
// empty so the product never presents sample projects, tasks, or reporting data.
const LOCAL_PERSONS: Person[] = [
  {
    id: "p-sarah",
    name: "Sarah Connor",
    email: "admin@futurelabs.io",
    role: "admin",
    title: "VP of Engineering",
  },
  {
    id: "p-alex",
    name: "Alex Chen",
    email: "member@futurelabs.io",
    role: "member",
    title: "Frontend Engineer",
  },
];

export function getInitialSeedDataset(): SeedData {
  return {
    persons: structuredClone(LOCAL_PERSONS),
    projects: [],
    tasks: [],
    blockers: [],
    availabilities: [],
    ledger: [],
  };
}
