import { Person } from "../entities/person.entity";
import { Project } from "../entities/project.entity";
import { Task, TaskStatus } from "../entities/task.entity";
import { Blocker } from "../entities/blocker.entity";
import { Availability } from "../entities/availability.entity";
import { LedgerRecord, LedgerSubjectType, LedgerChangeType } from "../entities/ledger-record.entity";
import { OperationalSignalsPayload } from "../entities/operational-signals.entity";
import { CreateTaskDto } from "../dtos/create-task.dto";
import { RaiseBlockerDto } from "../dtos/raise-blocker.dto";
import { CreateProjectDto } from "../dtos/create-project.dto";
import { RecordLeaveDto } from "../dtos/record-leave.dto";
import { CreatePersonDto } from "../dtos/create-person.dto";
import {
  UpdatePersonProfileDto,
  ChangePersonRoleDto,
  SetPersonStatusDto,
  RevokePersonSessionsDto,
} from "../dtos/manage-person.dto";

export interface TaskFilter {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LedgerFilter {
  subjectId?: string;
  subjectType?: LedgerSubjectType;
  actorId?: string;
  type?: LedgerChangeType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ITrackerApi {
  getProjectMembers(): Promise<
    import("../entities/project-member.entity").ProjectMember[]
  >;
  setProjectMember(
    projectId: string,
    personId: string,
    included: boolean,
    actorId: string,
  ): Promise<void>;
  closeProject(projectId: string, actorId: string): Promise<Project>;
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
  getTasks(filter?: TaskFilter): Promise<Task[]>;
  getTasksCount(filter?: TaskFilter): Promise<number>;
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
  createPerson(dto: CreatePersonDto): Promise<Person>;
  updateProfile(dto: UpdatePersonProfileDto): Promise<Person>;
  changeUserRole(dto: ChangePersonRoleDto): Promise<Person>;
  setPersonStatus(dto: SetPersonStatusDto): Promise<Person>;
  revokePersonSessions(dto: RevokePersonSessionsDto): Promise<void>;

  // Immutable Ledger & Signals
  getLedger(filter?: LedgerFilter): Promise<LedgerRecord[]>;
  getLedgerCount(filter?: LedgerFilter): Promise<number>;
  getDerivedSignals(simulatedDate: string): Promise<OperationalSignalsPayload>;

  // Reset to seed
  resetToSeedData(): Promise<void>;
  supportsDemoReset(): boolean;
}
