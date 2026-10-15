import type { ITrackerApi } from "../api/tracker-api.interface";

type Backend = Pick<
  ITrackerApi,
  | "getPersons"
  | "getAvailability"
  | "recordAvailability"
  | "createPerson"
  | "updateProfile"
  | "changeUserRole"
  | "setPersonStatus"
  | "revokePersonSessions"
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

  createPerson(
    ...args: Parameters<Backend["createPerson"]>
  ): ReturnType<Backend["createPerson"]> {
    return this.api.createPerson(...args);
  }

  updateProfile(
    ...args: Parameters<Backend["updateProfile"]>
  ): ReturnType<Backend["updateProfile"]> {
    return this.api.updateProfile(...args);
  }

  changeUserRole(
    ...args: Parameters<Backend["changeUserRole"]>
  ): ReturnType<Backend["changeUserRole"]> {
    return this.api.changeUserRole(...args);
  }

  setPersonStatus(
    ...args: Parameters<Backend["setPersonStatus"]>
  ): ReturnType<Backend["setPersonStatus"]> {
    return this.api.setPersonStatus(...args);
  }

  revokePersonSessions(
    ...args: Parameters<Backend["revokePersonSessions"]>
  ): ReturnType<Backend["revokePersonSessions"]> {
    return this.api.revokePersonSessions(...args);
  }
}
