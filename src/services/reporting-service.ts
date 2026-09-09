import type { ITrackerApi } from "../api/tracker-api.interface";

type Backend = Pick<ITrackerApi, "getLedger" | "getDerivedSignals">;

export class ReportingService {
  constructor(private readonly api: Backend) {}

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
