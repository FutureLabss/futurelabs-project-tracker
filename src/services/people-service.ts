import type { ITrackerApi } from "../api/tracker-api.interface";

type Backend = Pick<
  ITrackerApi,
  "getPersons" | "getAvailability" | "recordAvailability"
>;

export class PeopleService {
  constructor(private readonly api: Backend) {}

  getPersons(
    ...args: Parameters<Backend["getPersons"]>
  ): ReturnType<Backend["getPersons"]> {
    return this.api.getPersons(...args);
  }

  getAvailability(
    ...args: Parameters<Backend["getAvailability"]>
  ): ReturnType<Backend["getAvailability"]> {
    return this.api.getAvailability(...args);
  }

  recordAvailability(
    ...args: Parameters<Backend["recordAvailability"]>
  ): ReturnType<Backend["recordAvailability"]> {
    return this.api.recordAvailability(...args);
  }
}
