import { ITrackerApi, TaskFilter, LedgerFilter } from "../tracker-api.interface";
import { STORAGE_KEYS } from "./storage-keys";
import { Person } from "../../entities/person.entity";
import { Project } from "../../entities/project.entity";
import { Task, TaskComplexity, TaskStatus } from "../../entities/task.entity";
import { Blocker } from "../../entities/blocker.entity";
import { Availability } from "../../entities/availability.entity";
import { LedgerRecord } from "../../entities/ledger-record.entity";
import { OperationalSignalsPayload } from "../../entities/operational-signals.entity";
import { CreateTaskDto } from "../../dtos/create-task.dto";
import { RaiseBlockerDto } from "../../dtos/raise-blocker.dto";
import { CreateProjectDto } from "../../dtos/create-project.dto";
import { RecordLeaveDto } from "../../dtos/record-leave.dto";
import { CreatePersonDto } from "../../dtos/create-person.dto";
import {
  UpdatePersonProfileDto,
  ChangePersonRoleDto,
  SetPersonStatusDto,
  RevokePersonSessionsDto,
} from "../../dtos/manage-person.dto";
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
    await this.updateProjectMembership(projectId, personId, included, actorId, "Project access updated");
  }

  async setManagedProjectMember(
    projectId: string,
    personId: string,
    included: boolean,
    actorId: string,
  ): Promise<void> {
    await this.delay();
    this.requireManager(actorId);
    const project = this.getCollection<Project>(STORAGE_KEYS.PROJECTS).find((p) => p.id === projectId);
    if (!project || project.managerId !== actorId)
      throw new Error("Only the project's manager can change its team.");
    const person = this.getCollection<Person>(STORAGE_KEYS.PERSONS).find((p) => p.id === personId);
    if (included && (!person || person.status === "inactive" || !["member", "manager"].includes(person.role)))
      throw new Error("Select an active member or manager.");
    await this.updateProjectMembership(
      projectId,
      personId,
      included,
      actorId,
      included ? "Added by the project manager" : "Removed by the project manager",
    );
  }

  /** Shared membership rules for the admin and manager paths. */
  private async updateProjectMembership(
    projectId: string,
    personId: string,
    included: boolean,
    actorId: string,
    reason: string,
  ): Promise<void> {
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
      reason,
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

  private filterTasks(filter?: TaskFilter): Task[] {
    let tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    if (!filter) return tasks;

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
    if (filter.search && filter.search.trim().length > 0) {
      const q = filter.search.trim().toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    return tasks;
  }

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    await this.delay();
    const tasks = this.filterTasks(filter);
    if (filter?.offset !== undefined || filter?.limit !== undefined) {
      const offset = filter.offset ?? 0;
      const limit = filter.limit ?? tasks.length;
      return tasks.slice(offset, offset + limit);
    }
    return tasks;
  }

  async getTasksCount(filter?: TaskFilter): Promise<number> {
    await this.delay();
    return this.filterTasks(filter).length;
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

  /** Mirrors the database: only the assignee starts, submits or blocks their own work. */
  private requireAssignee(task: Task, actorId: string) {
    if (task.assigneeId !== actorId)
      throw new Error("Only the task's assignee can start it, submit it or raise a blocker on it.");
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
    if (status === "not_started" || status === "in_progress") this.requireAssignee(tasks[index], actorId);

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
    this.requireAssignee(tasks[index], actorId);

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

  // --- MANAGER WORKFLOWS (mirror tracker_manager_mutate) ---

  private requireManager(actorId: string) {
    const actor = this.getCollection<Person>(STORAGE_KEYS.PERSONS).find(
      (p) => p.id === actorId,
    );
    if (!actor || actor.role !== "manager" || actor.status === "inactive")
      throw new Error("Manager access is required.");
  }

  /** Returns the task once the actor is confirmed as its active project's manager. */
  private requireManagedTask(taskId: string, actorId: string) {
    this.requireManager(actorId);
    const tasks = this.getCollection<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error("Task not found.");
    const project = this.getCollection<Project>(STORAGE_KEYS.PROJECTS).find(
      (p) => p.id === tasks[index].projectId,
    );
    if (project?.managerId !== actorId)
      throw new Error("Only the project's manager can change this task.");
    if (project.state !== "active")
      throw new Error("Closed projects cannot be changed.");
    return { tasks, index };
  }

  async createManagedProject(
    dto: Omit<CreateProjectDto, "managerId">,
  ): Promise<Project> {
    await this.delay();
    this.requireManager(dto.actorId);
    if (!dto.name.trim()) throw new Error("A project name is required.");
    if (dto.targetDate < dto.startDate)
      throw new Error("The target date cannot be before the start date.");
    return this.createProject({ ...dto, managerId: dto.actorId });
  }

  async closeManagedProject(
    projectId: string,
    actorId: string,
  ): Promise<Project> {
    await this.delay();
    this.requireManager(actorId);
    const projects = this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.managerId !== actorId)
      throw new Error("Only the project's manager can close it.");
    if (project.state !== "active")
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

  async changeTaskComplexity(
    taskId: string,
    complexity: TaskComplexity,
    actorId: string,
    reason?: string,
  ): Promise<Task> {
    await this.delay();
    const { tasks, index } = this.requireManagedTask(taskId, actorId);
    const task = tasks[index];
    if (task.status === "accepted" || task.status === "cancelled")
      throw new Error("Completed or cancelled work cannot be modified.");
    if (task.complexity === complexity)
      throw new Error("The task already has this complexity.");
    const oldComplexity = task.complexity;
    task.complexity = complexity;
    this.setCollection(STORAGE_KEYS.TASKS, tasks);
    this.appendLedgerRecord({
      subjectId: taskId,
      subjectType: "task",
      actorId,
      type: "complexity_changed",
      fromValue: oldComplexity,
      toValue: complexity,
      reason: reason?.trim() || null,
    });
    return task;
  }

  async reopenTask(
    taskId: string,
    actorId: string,
    reason: string,
  ): Promise<Task> {
    await this.delay();
    const { tasks, index } = this.requireManagedTask(taskId, actorId);
    const task = tasks[index];
    if (task.status !== "accepted")
      throw new Error("Only accepted work can be reopened.");
    if (!reason?.trim())
      throw new Error("A reason is required when reopening work.");
    task.status = "in_progress";
    task.acceptedAt = null;
    task.acceptedBy = null;
    task.submittedAt = null;
    this.setCollection(STORAGE_KEYS.TASKS, tasks);
    this.appendLedgerRecord({
      subjectId: taskId,
      subjectType: "task",
      actorId,
      type: "task_reopened",
      fromValue: "accepted",
      toValue: "in_progress",
      reason: reason.trim(),
    });
    return task;
  }

  // --- BLOCKERS ---

  async getBlockers(taskId?: string): Promise<Blocker[]> {
    await this.delay();
    const blockers = this.getCollection<Blocker>(STORAGE_KEYS.BLOCKERS);
    return taskId ? blockers.filter((b) => b.taskId === taskId) : blockers;
  }

  async raiseBlocker(dto: RaiseBlockerDto): Promise<Blocker> {
    await this.delay();
    const blockedTask = this.getCollection<Task>(STORAGE_KEYS.TASKS).find((t) => t.id === dto.taskId);
    if (!blockedTask) throw new Error(`Task ${dto.taskId} not found`);
    this.requireAssignee(blockedTask, dto.actorId);
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

  async createPerson(dto: CreatePersonDto): Promise<Person> {
    await this.delay();
    this.requireAdmin(dto.actorId);
    const name = dto.name.trim();
    if (!name) throw new Error("Person name cannot be blank.");
    const email = dto.email.trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("A valid email is required.");
    const persons = this.getCollection<Person>(STORAGE_KEYS.PERSONS);
    if (persons.some((p) => p.email.toLowerCase() === email)) {
      throw new Error(`A person with email ${email} already exists.`);
    }

    const newPerson: Person = {
      id: `p-${crypto.randomUUID()}`,
      name,
      email,
      role: dto.role,
      status: dto.status ?? "active",
      title: dto.title?.trim() || undefined,
    };
    persons.push(newPerson);
    this.setCollection(STORAGE_KEYS.PERSONS, persons);

    this.appendLedgerRecord({
      subjectId: newPerson.id,
      subjectType: "person",
      actorId: dto.actorId,
      type: "person_created",
      fromValue: null,
      toValue: dto.role,
      reason: "Person account provisioned",
    });

    return newPerson;
  }

  async updateProfile(dto: UpdatePersonProfileDto): Promise<Person> {
    await this.delay();
    this.requireAdmin(dto.actorId);
    const persons = this.getCollection<Person>(STORAGE_KEYS.PERSONS);
    const index = persons.findIndex((p) => p.id === dto.personId);
    if (index === -1) throw new Error(`Person ${dto.personId} not found`);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new Error("Name cannot be blank.");
      persons[index].name = name;
    }
    if (dto.title !== undefined) {
      persons[index].title = dto.title.trim() || undefined;
    }
    if (dto.avatarUrl !== undefined) {
      persons[index].avatarUrl = dto.avatarUrl.trim() || undefined;
    }

    this.setCollection(STORAGE_KEYS.PERSONS, persons);
    this.appendLedgerRecord({
      subjectId: dto.personId,
      subjectType: "person",
      actorId: dto.actorId,
      type: "profile_updated",
      fromValue: null,
      toValue: null,
      reason: "Profile details updated",
    });

    return persons[index];
  }

  async changeUserRole(dto: ChangePersonRoleDto): Promise<Person> {
    await this.delay();
    this.requireAdmin(dto.actorId);
    const persons = this.getCollection<Person>(STORAGE_KEYS.PERSONS);
    const index = persons.findIndex((p) => p.id === dto.personId);
    if (index === -1) throw new Error(`Person ${dto.personId} not found`);

    const currentRole = persons[index].role;
    if (currentRole === "admin" && dto.role !== "admin") {
      const otherAdmins = persons.filter(
        (p) => p.role === "admin" && p.status !== "inactive" && p.id !== dto.personId,
      );
      if (otherAdmins.length === 0) {
        throw new Error("Cannot demote the last active administrator.");
      }
    }

    // If demoting from manager/admin to member, unassign from manager of active projects
    if (["manager", "admin"].includes(currentRole) && dto.role === "member") {
      const projects = this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
      const members = await this.getProjectMembers();
      let projectsChanged = false;
      let membersChanged = false;

      for (const p of projects) {
        if (p.managerId === dto.personId && p.state === "active") {
          p.managerId = null;
          projectsChanged = true;
          if (!members.some((m) => m.projectId === p.id && m.personId === dto.personId)) {
            members.push({ projectId: p.id, personId: dto.personId });
            membersChanged = true;
          }
        }
      }
      if (projectsChanged) this.setCollection(STORAGE_KEYS.PROJECTS, projects);
      if (membersChanged) this.setCollection(STORAGE_KEYS.PROJECT_MEMBERS, members);
    }

    persons[index].role = dto.role;
    this.setCollection(STORAGE_KEYS.PERSONS, persons);

    this.appendLedgerRecord({
      subjectId: dto.personId,
      subjectType: "person",
      actorId: dto.actorId,
      type: "role_changed",
      fromValue: currentRole,
      toValue: dto.role,
      reason: "User role updated",
    });

    return persons[index];
  }

  async setPersonStatus(dto: SetPersonStatusDto): Promise<Person> {
    await this.delay();
    this.requireAdmin(dto.actorId);
    const persons = this.getCollection<Person>(STORAGE_KEYS.PERSONS);
    const index = persons.findIndex((p) => p.id === dto.personId);
    if (index === -1) throw new Error(`Person ${dto.personId} not found`);

    const currentStatus = persons[index].status ?? "active";
    if (persons[index].role === "admin" && currentStatus === "active" && dto.status === "inactive") {
      const otherAdmins = persons.filter(
        (p) => p.role === "admin" && p.status !== "inactive" && p.id !== dto.personId,
      );
      if (otherAdmins.length === 0) {
        throw new Error("Cannot deactivate the last active administrator.");
      }
    }

    persons[index].status = dto.status;

    if (dto.status === "inactive") {
      const projects = this.getCollection<Project>(STORAGE_KEYS.PROJECTS);
      let projectsChanged = false;
      for (const p of projects) {
        if (p.managerId === dto.personId && p.state === "active") {
          p.managerId = null;
          projectsChanged = true;
        }
      }
      if (projectsChanged) this.setCollection(STORAGE_KEYS.PROJECTS, projects);
    }

    this.setCollection(STORAGE_KEYS.PERSONS, persons);

    this.appendLedgerRecord({
      subjectId: dto.personId,
      subjectType: "person",
      actorId: dto.actorId,
      type: "status_changed",
      fromValue: currentStatus,
      toValue: dto.status,
      reason: "Account status updated",
    });

    return persons[index];
  }

  async revokePersonSessions(dto: RevokePersonSessionsDto): Promise<void> {
    await this.delay();
    this.requireAdmin(dto.actorId);
    const persons = this.getCollection<Person>(STORAGE_KEYS.PERSONS);
    const person = persons.find((p) => p.id === dto.personId);
    if (!person) throw new Error(`Person ${dto.personId} not found`);

    this.appendLedgerRecord({
      subjectId: dto.personId,
      subjectType: "person",
      actorId: dto.actorId,
      type: "sessions_revoked",
      fromValue: null,
      toValue: null,
      reason: "Active tracker sessions revoked",
    });
  }

  // --- LEDGER & SIGNALS ---

  private filterLedger(filter?: LedgerFilter): LedgerRecord[] {
    let ledger = this.getCollection<LedgerRecord>(STORAGE_KEYS.LEDGER);
    if (!filter) {
      return [...ledger].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );
    }
    if (filter.subjectId) {
      ledger = ledger.filter((l) => l.subjectId === filter.subjectId);
    }
    if (filter.subjectType) {
      ledger = ledger.filter((l) => l.subjectType === filter.subjectType);
    }
    if (filter.actorId) {
      ledger = ledger.filter((l) => l.actorId === filter.actorId);
    }
    if (filter.type) {
      ledger = ledger.filter((l) => l.type === filter.type);
    }
    if (filter.search && filter.search.trim().length > 0) {
      const q = filter.search.trim().toLowerCase();
      ledger = ledger.filter(
        (l) =>
          (l.reason && l.reason.toLowerCase().includes(q)) ||
          l.type.toLowerCase().includes(q) ||
          l.subjectType.toLowerCase().includes(q),
      );
    }
    return [...ledger].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }

  async getLedger(filter?: LedgerFilter): Promise<LedgerRecord[]> {
    await this.delay();
    const list = this.filterLedger(filter);
    if (filter?.offset !== undefined || filter?.limit !== undefined) {
      const offset = filter.offset ?? 0;
      const limit = filter.limit ?? list.length;
      return list.slice(offset, offset + limit);
    }
    return list;
  }

  async getLedgerCount(filter?: LedgerFilter): Promise<number> {
    await this.delay();
    return this.filterLedger(filter).length;
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

  supportsDemoReset(): boolean {
    return true;
  }
}

