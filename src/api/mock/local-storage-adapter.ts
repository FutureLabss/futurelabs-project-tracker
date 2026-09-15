import { ITrackerApi } from "../tracker-api.interface";
import { STORAGE_KEYS } from "./storage-keys";
import { Person } from "../../entities/person.entity";
import { Project } from "../../entities/project.entity";
import { Task, TaskStatus } from "../../entities/task.entity";
import { Blocker } from "../../entities/blocker.entity";
import { Availability } from "../../entities/availability.entity";
import { LedgerRecord } from "../../entities/ledger-record.entity";
import { OperationalSignalsPayload } from "../../entities/operational-signals.entity";
import { CreateTaskDto } from "../../dtos/create-task.dto";
import { RaiseBlockerDto } from "../../dtos/raise-blocker.dto";
import { CreateProjectDto } from "../../dtos/create-project.dto";
import { RecordLeaveDto } from "../../dtos/record-leave.dto";
import { getInitialSeedDataset } from "../../domain/seed/initial-dataset";
import { calculateOperationalSignals } from "../../domain/calculations/derived-signals";

export class MockLocalStorageApi implements ITrackerApi {
  async getProjectMembers(): Promise<
    import("../../entities/project-member.entity").ProjectMember[]
  > {
    this.ensureInitialized();
    const stored = this.storage.getItem(STORAGE_KEYS.PROJECT_MEMBERS);
    if (stored) return JSON.parse(stored);
    const rows = this.getCollection<Task>(STORAGE_KEYS.TASKS)
      .filter((t) => t.assigneeId)
      .map((t) => ({ projectId: t.projectId, personId: t.assigneeId! }));
    const unique = [
      ...new Map(
        rows.map((row) => [`${row.projectId}:${row.personId}`, row]),
      ).values(),
    ];
    this.setCollection(STORAGE_KEYS.PROJECT_MEMBERS, unique);
    return unique;
  }
  private requireAdmin(actorId: string) {
    if (
      !this.getCollection<Person>(STORAGE_KEYS.PERSONS).some(
        (p) => p.id === actorId && p.role === "admin",
      )
    )
      throw new Error("Administrator access is required.");
  }
  async setProjectMember(
    projectId: string,
    personId: string,
    included: boolean,
    actorId: string,
  ): Promise<void> {
    this.requireAdmin(actorId);
    const project = await this.getProjectById(projectId);
    if (!project || project.state !== "active")
      throw new Error("An active project is required.");
    if (
      !this.getCollection<Person>(STORAGE_KEYS.PERSONS).some(
        (p) => p.id === personId && (!included || p.status !== "inactive"),
      )
    )
      throw new Error("Select an active person.");
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS).filter(
      (t) => t.projectId === projectId,
    );
    if (
      !included &&
      (tasks.some(
        (t) =>
          t.assigneeId === personId &&
          !["accepted", "cancelled"].includes(t.status),
      ) ||
        this.getCollection<Blocker>(STORAGE_KEYS.BLOCKERS).some(
          (b) =>
            b.ownerId === personId &&
            !b.clearedAt &&
            tasks.some((t) => t.id === b.taskId),
        ))
    )
      throw new Error(
        "Reassign open tasks and resolve owned blockers before removing access.",
      );
    const rows = (await this.getProjectMembers()).filter(
      (m) => m.projectId !== projectId || m.personId !== personId,
    );
    if (included) rows.push({ projectId, personId });
    this.setCollection(STORAGE_KEYS.PROJECT_MEMBERS, rows);
    this.appendLedgerRecord({
      subjectId: projectId,
      subjectType: "project",
      actorId,
      type: included ? "project_member_added" : "project_member_removed",
      fromValue: included ? null : personId,
      toValue: included ? personId : null,
      reason: "Project access updated",
    });
  }
  async closeProject(projectId: string, actorId: string): Promise<Project> {
    this.requireAdmin(actorId);
    const projects = this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.state !== "active")
      throw new Error("An active project is required.");
    if (
      this.getCollection<Task>(STORAGE_KEYS.TASKS).some(
        (t) =>
          t.projectId === projectId &&
          !["accepted", "cancelled"].includes(t.status),
      )
    )
      throw new Error(
        "Accept or cancel all open tasks before closing this project.",
      );
    project.state = "closed";
    this.setCollection(STORAGE_KEYS.PROJECTS, projects);
    this.appendLedgerRecord({
      subjectId: projectId,
      subjectType: "project",
      actorId,
      type: "project_closed",
      fromValue: "active",
      toValue: "closed",
      reason: "Project completed",
    });
    return project;
  }

  constructor(
    private readonly storageOverride?: Pick<Storage, "getItem" | "setItem">,
  ) {}

  private get storage(): Pick<Storage, "getItem" | "setItem"> {
    const storage = this.storageOverride ?? globalThis.localStorage;
    if (!storage)
      throw new Error(
        "Local storage is unavailable. Provide a storage adapter.",
      );
    return storage;
  }

  private async delay(ms: number = 40): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private ensureInitialized(): void {
    const hasData = this.storage.getItem(STORAGE_KEYS.TASKS);
    if (!hasData) {
      this.resetStorageToSeed();
    }
  }

  private resetStorageToSeed(): void {
    const seed = getInitialSeedDataset();
    this.storage.setItem(
      STORAGE_KEYS.PROJECT_MEMBERS,
      JSON.stringify([
        ...new Map(
          seed.tasks
            .filter((t) => t.assigneeId)
            .map((t) => [
              `${t.projectId}:${t.assigneeId}`,
              { projectId: t.projectId, personId: t.assigneeId! },
            ]),
        ).values(),
      ]),
    );
    this.storage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(seed.persons));
    this.storage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(seed.projects));
    this.storage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(seed.tasks));
    this.storage.setItem(STORAGE_KEYS.BLOCKERS, JSON.stringify(seed.blockers));
    this.storage.setItem(
      STORAGE_KEYS.AVAILABILITIES,
      JSON.stringify(seed.availabilities),
    );
    this.storage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(seed.ledger));
  }

  private getCollection<T>(key: string): T[] {
    this.ensureInitialized();
    const raw = this.storage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  private setCollection<T>(key: string, data: T[]): void {
    this.storage.setItem(key, JSON.stringify(data));
  }

  private appendLedgerRecord(
    record: Omit<LedgerRecord, "id" | "occurredAt">,
  ): LedgerRecord {
    const ledger = this.getCollection<LedgerRecord>(STORAGE_KEYS.LEDGER);
    const newRecord: LedgerRecord = {
      ...record,
      id: `l-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      occurredAt: new Date().toISOString(),
    };
    ledger.push(newRecord);
    this.setCollection(STORAGE_KEYS.LEDGER, ledger);
    return newRecord;
  }

  // --- PROJECTS ---

  async getProjects(): Promise<Project[]> {
    await this.delay();
    return this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
  }

  async getProjectById(id: string): Promise<Project | null> {
    await this.delay();
    const projects = this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
    return projects.find((p) => p.id === id) || null;
  }

  async createProject(dto: CreateProjectDto): Promise<Project> {
    await this.delay();
    const projects = this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
    const newProject: Project = {
      id: `proj-${crypto.randomUUID()}`,
      name: dto.name,
      goal: dto.goal,
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      managerId: dto.managerId,
      state: "active",
      createdAt: new Date().toISOString(),
    };
    projects.push(newProject);
    this.setCollection(STORAGE_KEYS.PROJECTS, projects);

    this.appendLedgerRecord({
      subjectId: newProject.id,
      subjectType: "project",
      actorId: dto.actorId,
      type: "project_created",
      fromValue: null,
      toValue: newProject.name,
      reason: "Project initialized",
    });

    if (newProject.managerId) {
      this.appendLedgerRecord({
        subjectId: newProject.id,
        subjectType: "project",
        actorId: dto.actorId,
        type: "manager_assigned",
        fromValue: null,
        toValue: newProject.managerId,
        reason: "Manager designated on creation",
      });
    }

    return newProject;
  }

  async assignProjectManager(
    projectId: string,
    managerId: string | null,
    actorId: string,
  ): Promise<Project> {
    await this.delay();
    const projects = this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) throw new Error(`Project ${projectId} not found`);

    const oldManager = projects[index].managerId;
    projects[index].managerId = managerId;
    this.setCollection(STORAGE_KEYS.PROJECTS, projects);

    this.appendLedgerRecord({
      subjectId: projectId,
      subjectType: "project",
      actorId,
      type: "manager_assigned",
      fromValue: oldManager,
      toValue: managerId,
      reason: managerId
        ? "Designated project lead"
        : "Removed project lead assignment",
    });

    return projects[index];
  }

  // --- TASKS ---

  async getTasks(filter?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus[];
  }): Promise<Task[]> {
    await this.delay();
    let tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);

    if (filter) {
      if (filter.projectId) {
        tasks = tasks.filter((t) => t.projectId === filter.projectId);
      }
      if (filter.assigneeId) {
        tasks = tasks.filter((t) => t.assigneeId === filter.assigneeId);
      }
      if (filter.status && filter.status.length > 0) {
        const allowed = new Set(filter.status);
        tasks = tasks.filter((t) => allowed.has(t.status));
      }
    }

    return tasks;
  }

  async getTaskById(id: string): Promise<Task | null> {
    await this.delay();
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    return tasks.find((t) => t.id === id) || null;
  }

  async createTask(dto: CreateTaskDto): Promise<Task> {
    await this.delay();
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const newTask: Task = {
      id: `task-${crypto.randomUUID()}`,
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description,
      assigneeId: dto.assigneeId,
      status: "not_started",
      complexity: dto.complexity,
      origin: dto.origin,
      dueDate: dto.dueDate,
      submittedAt: null,
      acceptedAt: null,
      acceptedBy: null,
      activeBlockerId: null,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    this.setCollection(STORAGE_KEYS.TASKS, tasks);

    this.appendLedgerRecord({
      subjectId: newTask.id,
      subjectType: "task",
      actorId: dto.actorId,
      type: "task_created",
      fromValue: null,
      toValue: newTask.title,
      reason: `${dto.origin === "unplanned" ? "Unplanned/Ad-hoc" : "Planned"} task created`,
    });

    return newTask;
  }

  async assignTask(
    taskId: string,
    assigneeId: string | null,
    actorId: string,
  ): Promise<Task> {
    await this.delay();
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task ${taskId} not found`);

    const oldAssignee = tasks[index].assigneeId;
    tasks[index].assigneeId = assigneeId;
    this.setCollection(STORAGE_KEYS.TASKS, tasks);

    this.appendLedgerRecord({
      subjectId: taskId,
      subjectType: "task",
      actorId,
      type: "task_reassigned",
      fromValue: oldAssignee,
      toValue: assigneeId,
      reason: assigneeId ? "Task owner designated" : "Task owner unassigned",
    });

    return tasks[index];
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    actorId: string,
  ): Promise<Task> {
    await this.delay();
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task ${taskId} not found`);

    const oldStatus = tasks[index].status;
    tasks[index].status = status;

    // SR-D05: Automatically close active blocker and clear review queue if task is cancelled
    if (status === "cancelled") {
      if (tasks[index].activeBlockerId) {
        const blockerId = tasks[index].activeBlockerId!;
        const blockers = this.getCollection<Blocker>(STORAGE_KEYS.BLOCKERS);
        const bIdx = blockers.findIndex((b) => b.id === blockerId);
        if (bIdx !== -1 && !blockers[bIdx].clearedAt) {
          blockers[bIdx].clearedAt = new Date().toISOString();
          blockers[bIdx].clearedBy = actorId;
          this.setCollection(STORAGE_KEYS.BLOCKERS, blockers);

          this.appendLedgerRecord({
            subjectId: blockerId,
            subjectType: "blocker",
            actorId,
            type: "blocker_cleared",
            fromValue: "active",
            toValue: "cleared",
            reason: "Task was cancelled (Automated SR-D05)",
          });
        }
        tasks[index].activeBlockerId = null;
      }
      tasks[index].submittedAt = null;
    }

    this.setCollection(STORAGE_KEYS.TASKS, tasks);

    this.appendLedgerRecord({
      subjectId: taskId,
      subjectType: "task",
      actorId,
      type: "status_changed",
      fromValue: oldStatus,
      toValue: status,
      reason: null,
    });

    return tasks[index];
  }

  async rescheduleTask(
    taskId: string,
    newDueDate: string,
    reason: string,
    actorId: string,
  ): Promise<Task> {
    await this.delay();
    if (!reason || reason.trim().length === 0) {
      throw new Error(
        "A recorded reason is strictly mandatory when rescheduling task due dates.",
      );
    }

    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task ${taskId} not found`);

    const oldDueDate = tasks[index].dueDate;
    tasks[index].dueDate = newDueDate;
    this.setCollection(STORAGE_KEYS.TASKS, tasks);

    this.appendLedgerRecord({
      subjectId: taskId,
      subjectType: "task",
      actorId,
      type: "task_redated",
      fromValue: oldDueDate,
      toValue: newDueDate,
      reason: reason.trim(),
    });

    return tasks[index];
  }

  async submitTask(
    taskId: string,
    actorId: string,
    notes?: string,
    deliverableUrl?: string,
  ): Promise<Task> {
    await this.delay();
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task ${taskId} not found`);

    const oldStatus = tasks[index].status;
    tasks[index].status = "submitted";
    tasks[index].submittedAt = new Date().toISOString();
    if (notes !== undefined) tasks[index].submissionNotes = notes;
    if (deliverableUrl !== undefined)
      tasks[index].deliverableUrl = deliverableUrl;
    this.setCollection(STORAGE_KEYS.TASKS, tasks);

    this.appendLedgerRecord({
      subjectId: taskId,
      subjectType: "task",
      actorId,
      type: "task_submitted",
      fromValue: oldStatus,
      toValue: "submitted",
      reason: notes || "Submitted for manager review gate acceptance",
    });

    return tasks[index];
  }

  async acceptTask(taskId: string, managerId: string): Promise<Task> {
    await this.delay();
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task ${taskId} not found`);

    const oldStatus = tasks[index].status;
    tasks[index].status = "accepted";
    tasks[index].acceptedAt = new Date().toISOString();
    tasks[index].acceptedBy = managerId;
    this.setCollection(STORAGE_KEYS.TASKS, tasks);

    this.appendLedgerRecord({
      subjectId: taskId,
      subjectType: "task",
      actorId: managerId,
      type: "task_accepted",
      fromValue: oldStatus,
      toValue: "accepted",
      reason: "Accepted delivery criteria satisfied",
    });

    return tasks[index];
  }

  async returnTask(
    taskId: string,
    managerId: string,
    reason: string,
  ): Promise<Task> {
    await this.delay();
    if (!reason || reason.trim().length === 0) {
      throw new Error(
        "A constructive explanation is mandatory when returning work for rework.",
      );
    }

    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error(`Task ${taskId} not found`);

    const oldStatus = tasks[index].status;
    tasks[index].status = "in_progress";
    tasks[index].submittedAt = null;
    this.setCollection(STORAGE_KEYS.TASKS, tasks);

    this.appendLedgerRecord({
      subjectId: taskId,
      subjectType: "task",
      actorId: managerId,
      type: "task_returned",
      fromValue: oldStatus,
      toValue: "in_progress",
      reason: reason.trim(),
    });

    return tasks[index];
  }

  // --- BLOCKERS ---

  async getBlockers(taskId?: string): Promise<Blocker[]> {
    await this.delay();
    const blockers = this.getCollection<Blocker>(STORAGE_KEYS.BLOCKERS);
    return taskId ? blockers.filter((b) => b.taskId === taskId) : blockers;
  }

  async raiseBlocker(dto: RaiseBlockerDto): Promise<Blocker> {
    await this.delay();
    const blockers = this.getCollection<Blocker>(STORAGE_KEYS.BLOCKERS);
    const newBlocker: Blocker = {
      id: `blocker-${crypto.randomUUID()}`,
      taskId: dto.taskId,
      category: dto.category,
      description: dto.description,
      ownerId: dto.ownerId,
      blockingTaskId: dto.blockingTaskId,
      raisedAt: new Date().toISOString(),
      clearedAt: null,
      clearedBy: null,
    };
    blockers.push(newBlocker);
    this.setCollection(STORAGE_KEYS.BLOCKERS, blockers);

    // Update the task status to blocked and link activeBlockerId
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex((t) => t.id === dto.taskId);
    if (taskIndex !== -1) {
      const oldStatus = tasks[taskIndex].status;
      tasks[taskIndex].status = "blocked";
      tasks[taskIndex].activeBlockerId = newBlocker.id;
      this.setCollection(STORAGE_KEYS.TASKS, tasks);

      this.appendLedgerRecord({
        subjectId: dto.taskId,
        subjectType: "task",
        actorId: dto.actorId,
        type: "status_changed",
        fromValue: oldStatus,
        toValue: "blocked",
        reason: `Blocked: ${dto.description}`,
      });
    }

    this.appendLedgerRecord({
      subjectId: newBlocker.id,
      subjectType: "blocker",
      actorId: dto.actorId,
      type: "blocker_raised",
      fromValue: null,
      toValue: dto.category,
      reason: dto.description,
    });

    return newBlocker;
  }

  async clearBlocker(blockerId: string, actorId: string): Promise<Blocker> {
    await this.delay();
    const blockers = this.getCollection<Blocker>(STORAGE_KEYS.BLOCKERS);
    const index = blockers.findIndex((b) => b.id === blockerId);
    if (index === -1) throw new Error(`Blocker ${blockerId} not found`);

    blockers[index].clearedAt = new Date().toISOString();
    blockers[index].clearedBy = actorId;
    this.setCollection(STORAGE_KEYS.BLOCKERS, blockers);

    const clearedBlocker = blockers[index];

    // Unblock the linked task if it's currently marked with this active blocker
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex((t) => t.id === clearedBlocker.taskId);
    if (taskIndex !== -1 && tasks[taskIndex].activeBlockerId === blockerId) {
      const oldStatus = tasks[taskIndex].status;
      tasks[taskIndex].status = "in_progress";
      tasks[taskIndex].activeBlockerId = null;
      this.setCollection(STORAGE_KEYS.TASKS, tasks);

      this.appendLedgerRecord({
        subjectId: clearedBlocker.taskId,
        subjectType: "task",
        actorId,
        type: "status_changed",
        fromValue: oldStatus,
        toValue: "in_progress",
        reason: "Blocker cleared and resolved",
      });
    }

    this.appendLedgerRecord({
      subjectId: blockerId,
      subjectType: "blocker",
      actorId,
      type: "blocker_cleared",
      fromValue: clearedBlocker.category,
      toValue: "cleared",
      reason: "Blocker resolved",
    });

    return clearedBlocker;
  }

  // --- PERSONS & AVAILABILITY ---

  async getPersons(): Promise<Person[]> {
    await this.delay();
    return this.getCollection<Person>(STORAGE_KEYS.PERSONS);
  }

  async getAvailability(personId?: string): Promise<Availability[]> {
    await this.delay();
    const avail = this.getCollection<Availability>(STORAGE_KEYS.AVAILABILITIES);
    return personId ? avail.filter((a) => a.personId === personId) : avail;
  }

  async recordAvailability(dto: RecordLeaveDto): Promise<Availability> {
    await this.delay();
    const list = this.getCollection<Availability>(STORAGE_KEYS.AVAILABILITIES);
    const newAvail: Availability = {
      id: `avail-${crypto.randomUUID()}`,
      personId: dto.personId,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      note: dto.note,
    };
    list.push(newAvail);
    this.setCollection(STORAGE_KEYS.AVAILABILITIES, list);

    this.appendLedgerRecord({
      subjectId: newAvail.id,
      subjectType: "availability",
      actorId: dto.actorId,
      type: "leave_recorded",
      fromValue: null,
      toValue: `${dto.fromDate} to ${dto.toDate}`,
      reason: dto.note,
    });

    return newAvail;
  }

  // --- LEDGER & SIGNALS ---

  async getLedger(filter?: {
    subjectId?: string;
    actorId?: string;
  }): Promise<LedgerRecord[]> {
    await this.delay();
    let ledger = this.getCollection<LedgerRecord>(STORAGE_KEYS.LEDGER);
    if (filter) {
      if (filter.subjectId) {
        ledger = ledger.filter((l) => l.subjectId === filter.subjectId);
      }
      if (filter.actorId) {
        ledger = ledger.filter((l) => l.actorId === filter.actorId);
      }
    }
    // Return sorted newest first
    return ledger.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }

  async getDerivedSignals(
    simulatedDate: string,
  ): Promise<OperationalSignalsPayload> {
    await this.delay();
    const persons = this.getCollection<Person>(STORAGE_KEYS.PERSONS);
    const projects = this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const blockers = this.getCollection<Blocker>(STORAGE_KEYS.BLOCKERS);
    const availabilities = this.getCollection<Availability>(
      STORAGE_KEYS.AVAILABILITIES,
    );
    const ledger = this.getCollection<LedgerRecord>(STORAGE_KEYS.LEDGER);

    return calculateOperationalSignals(
      persons,
      projects,
      tasks,
      blockers,
      availabilities,
      ledger,
      simulatedDate,
    );
  }

  // --- RESET SEED ---

  async resetToSeedData(): Promise<void> {
    await this.delay();
    this.resetStorageToSeed();
  }
}
