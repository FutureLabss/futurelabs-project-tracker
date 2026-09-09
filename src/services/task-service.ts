import type { ITrackerApi } from "../api/tracker-api.interface";

type Backend = Pick<
  ITrackerApi,
  | "getTasks"
  | "getTaskById"
  | "createTask"
  | "assignTask"
  | "updateTaskStatus"
  | "rescheduleTask"
  | "submitTask"
  | "acceptTask"
  | "returnTask"
>;

export class TaskService {
  constructor(private readonly api: Backend) {}

  getTasks(
    ...args: Parameters<Backend["getTasks"]>
  ): ReturnType<Backend["getTasks"]> {
    return this.api.getTasks(...args);
  }

  getTaskById(
    ...args: Parameters<Backend["getTaskById"]>
  ): ReturnType<Backend["getTaskById"]> {
    return this.api.getTaskById(...args);
  }

  createTask(
    ...args: Parameters<Backend["createTask"]>
  ): ReturnType<Backend["createTask"]> {
    return this.api.createTask(...args);
  }

  assignTask(
    ...args: Parameters<Backend["assignTask"]>
  ): ReturnType<Backend["assignTask"]> {
    return this.api.assignTask(...args);
  }

  updateTaskStatus(
    ...args: Parameters<Backend["updateTaskStatus"]>
  ): ReturnType<Backend["updateTaskStatus"]> {
    return this.api.updateTaskStatus(...args);
  }

  rescheduleTask(
    ...args: Parameters<Backend["rescheduleTask"]>
  ): ReturnType<Backend["rescheduleTask"]> {
    return this.api.rescheduleTask(...args);
  }

  submitTask(
    ...args: Parameters<Backend["submitTask"]>
  ): ReturnType<Backend["submitTask"]> {
    return this.api.submitTask(...args);
  }

  acceptTask(
    ...args: Parameters<Backend["acceptTask"]>
  ): ReturnType<Backend["acceptTask"]> {
    return this.api.acceptTask(...args);
  }

  returnTask(
    ...args: Parameters<Backend["returnTask"]>
  ): ReturnType<Backend["returnTask"]> {
    return this.api.returnTask(...args);
  }
}
