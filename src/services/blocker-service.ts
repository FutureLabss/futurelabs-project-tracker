import type { ITrackerApi } from "../api/tracker-api.interface";

type Backend = Pick<
  ITrackerApi,
  "getBlockers" | "raiseBlocker" | "clearBlocker"
>;

export class BlockerService {
  constructor(private readonly api: Backend) {}

  getBlockers(
    ...args: Parameters<Backend["getBlockers"]>
  ): ReturnType<Backend["getBlockers"]> {
    return this.api.getBlockers(...args);
  }

  raiseBlocker(
    ...args: Parameters<Backend["raiseBlocker"]>
  ): ReturnType<Backend["raiseBlocker"]> {
    return this.api.raiseBlocker(...args);
  }

  clearBlocker(
    ...args: Parameters<Backend["clearBlocker"]>
  ): ReturnType<Backend["clearBlocker"]> {
    return this.api.clearBlocker(...args);
  }
}
