import type { ITrackerApi } from "../api/tracker-api.interface";

type Backend = Pick<ITrackerApi, "resetToSeedData">;

export class DemoService {
  constructor(private readonly api: Backend) {}

  resetToSeedData(
    ...args: Parameters<Backend["resetToSeedData"]>
  ): ReturnType<Backend["resetToSeedData"]> {
    return this.api.resetToSeedData(...args);
  }
}
