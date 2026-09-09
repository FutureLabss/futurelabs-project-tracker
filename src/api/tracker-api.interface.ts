import { Person } from "../entities/person.entity";
import { Project } from "../entities/project.entity";
import { Task, TaskStatus } from "../entities/task.entity";
import { Blocker } from "../entities/blocker.entity";
import { Availability } from "../entities/availability.entity";
import { LedgerRecord } from "../entities/ledger-record.entity";
import { OperationalSignalsPayload } from "../entities/operational-signals.entity";
import { CreateTaskDto } from "../dtos/create-task.dto";
import { RaiseBlockerDto } from "../dtos/raise-blocker.dto";
import { CreateProjectDto } from "../dtos/create-project.dto";
import { RecordLeaveDto } from "../dtos/record-leave.dto";

export interface ITrackerApi {
  // Projects
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  createProject(dto: CreateProjectDto): Promise<Project>;
  assignProjectManager(
    projectId: string,
    managerId: string | null,
    actorId: string,
  ): Promise<Project>;

  // Tasks
  getTasks(filter?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus[];
  }): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  createTask(dto: CreateTaskDto): Promise<Task>;
  assignTask(
    taskId: string,
    assigneeId: string | null,
    actorId: string,
  ): Promise<Task>;
  updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    actorId: string,
  ): Promise<Task>;
  rescheduleTask(
    taskId: string,
    newDueDate: string,
    reason: string,
    actorId: string,
  ): Promise<Task>;
  submitTask(
    taskId: string,
    actorId: string,
    notes?: string,
    deliverableUrl?: string,
  ): Promise<Task>;
  acceptTask(taskId: string, managerId: string): Promise<Task>;
  returnTask(taskId: string, managerId: string, reason: string): Promise<Task>;

  // Blockers
  getBlockers(taskId?: string): Promise<Blocker[]>;
  raiseBlocker(dto: RaiseBlockerDto): Promise<Blocker>;
  clearBlocker(blockerId: string, actorId: string): Promise<Blocker>;

  // Availability & People
  getPersons(): Promise<Person[]>;
  getAvailability(personId?: string): Promise<Availability[]>;
  recordAvailability(dto: RecordLeaveDto): Promise<Availability>;

  // Immutable Ledger & Signals
  getLedger(filter?: {
    subjectId?: string;
    actorId?: string;
  }): Promise<LedgerRecord[]>;
  getDerivedSignals(simulatedDate: string): Promise<OperationalSignalsPayload>;

  // Reset to seed
  resetToSeedData(): Promise<void>;
}
