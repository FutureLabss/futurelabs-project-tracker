import type { ITrackerApi } from "../api/tracker-api.interface";
import { TaskService } from "./task-service";
import { ProjectService } from "./project-service";
import { BlockerService } from "./blocker-service";
import { PeopleService } from "./people-service";
import { ReportingService } from "./reporting-service";
import { DemoService } from "./demo-service";

// The only composition point that chooses a backend implementation.
export function createTrackerServices(api: ITrackerApi) {
  return {
    taskService: new TaskService(api),
    projectService: new ProjectService(api),
    blockerService: new BlockerService(api),
    peopleService: new PeopleService(api),
    reportingService: new ReportingService(api),
    demoService: new DemoService(api),
  };
}
