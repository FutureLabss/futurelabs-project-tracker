import { calculateOperationalSignals } from "../domain/calculations/derived-signals";
import type { Person } from "../entities/person.entity";
import type { Project } from "../entities/project.entity";
import type { Task } from "../entities/task.entity";
import type { Blocker } from "../entities/blocker.entity";
import type { Availability } from "../entities/availability.entity";
import type { LedgerRecord } from "../entities/ledger-record.entity";
import type { ITrackerApi } from "../api/tracker-api.interface";

type Backend = Pick<ITrackerApi, "getLedger" | "getDerivedSignals">;

export class ReportingService {
  constructor(private readonly api: Backend) {}

  // Derive all dashboard totals from the same loaded records as its detail tables.
  summarize(
    data: {
      people: Person[];
      projects: Project[];
      tasks: Task[];
      blockers: Blocker[];
      availability: Availability[];
      ledger: LedgerRecord[];
    },
    date: string,
  ) {
    return calculateOperationalSignals(
      data.people,
      data.projects,
      data.tasks,
      data.blockers,
      data.availability,
      data.ledger,
      date,
    );
  }

  getLedger(
    ...args: Parameters<Backend["getLedger"]>
  ): ReturnType<Backend["getLedger"]> {
    return this.api.getLedger(...args);
  }

  getDerivedSignals(
    ...args: Parameters<Backend["getDerivedSignals"]>
  ): ReturnType<Backend["getDerivedSignals"]> {
    return this.api.getDerivedSignals(...args);
  }
}
