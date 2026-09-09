import type { ITrackerApi } from "../api/tracker-api.interface";

type Backend = Pick<
  ITrackerApi,
  "getProjects" | "getProjectById" | "createProject" | "assignProjectManager"
>;

export class ProjectService {
  constructor(private readonly api: Backend) {}

  getProjects(
    ...args: Parameters<Backend["getProjects"]>
  ): ReturnType<Backend["getProjects"]> {
    return this.api.getProjects(...args);
  }

  getProjectById(
    ...args: Parameters<Backend["getProjectById"]>
  ): ReturnType<Backend["getProjectById"]> {
    return this.api.getProjectById(...args);
  }

  createProject(
    ...args: Parameters<Backend["createProject"]>
  ): ReturnType<Backend["createProject"]> {
    return this.api.createProject(...args);
  }

  assignProjectManager(
    ...args: Parameters<Backend["assignProjectManager"]>
  ): ReturnType<Backend["assignProjectManager"]> {
    return this.api.assignProjectManager(...args);
  }
}
