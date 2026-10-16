import type { SupabaseClient } from "@supabase/supabase-js";
import type { ITrackerApi, TaskFilter, LedgerFilter } from "../tracker-api.interface";
import type { Database, Json } from "../../lib/supabase/database.types";
import type {
  ProfileRow,
  ProjectRow,
  TaskRow,
  BlockerRow,
  AvailabilityRow,
} from "../../lib/supabase/database-rows";
import {
  mapProfile,
  mapProject,
  mapTask,
  mapBlocker,
  mapAvailability,
  mapLedger,
} from "./mappers";
import { calculateOperationalSignals } from "../../domain/calculations/derived-signals";

export class SupabaseTrackerApi implements ITrackerApi {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async getProjectMembers() {
    return (
      await this.all((from, to) =>
        this.client
          .from("project_members")
          .select("*")
          .order("project_id")
          .order("lms_user_id")
          .range(from, to),
      )
    ).map((row) => ({ projectId: row.project_id, personId: row.lms_user_id }));
  }
  async setProjectMember(
    projectId: string,
    personId: string,
    included: boolean,
    _actorId: string,
  ) {
    const { error } = await this.client.rpc("tracker_admin_mutate", {
      operation: "set_project_member",
      payload: { project_id: projectId, person_id: personId, included },
    });
    if (error) throw new Error(error.message);
  }
  async closeProject(projectId: string, _actorId: string) {
    const { data, error } = await this.client.rpc("tracker_admin_mutate", {
      operation: "close_project",
      payload: { project_id: projectId },
    });
    if (error) throw new Error(error.message);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("No project returned.");
    return mapProject(data as ProjectRow);
  }

  private async all<T>(
    fetchPage: (
      from: number,
      to: number,
    ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  ): Promise<T[]> {
    const rows: T[] = [];
    for (let from = 0; ; from += 500) {
      const { data, error } = await fetchPage(from, from + 499);
      if (error) throw new Error(error.message);
      rows.push(...(data ?? []));
      if (!data || data.length < 500) return rows;
    }
  }

  private async mutate<T>(operation: string, payload: Json): Promise<T> {
    const { data, error } = await this.client.rpc("tracker_mutate", {
      operation,
      payload,
    });
    if (error) throw new Error(error.message);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("The tracker mutation returned no record.");
    return data as T;
  }

  async getProjects() {
    return (
      await this.all((from, to) =>
        this.client.from("projects").select("*").order("id").range(from, to),
      )
    ).map(mapProject);
  }
  async getProjectById(id: string) {
    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProject(data) : null;
  }
  async createProject(dto: Parameters<ITrackerApi["createProject"]>[0]) {
    return mapProject(
      await this.mutate<ProjectRow>("create_project", {
        name: dto.name,
        goal: dto.goal,
        start_date: dto.startDate,
        target_date: dto.targetDate,
        manager_id: dto.managerId,
      }),
    );
  }
  async assignProjectManager(
    projectId: string,
    managerId: string | null,
    _actorId: string,
  ) {
    return mapProject(
      await this.mutate<ProjectRow>("assign_project_manager", {
        project_id: projectId,
        manager_id: managerId,
      }),
    );
  }
  async getTasks(filter?: TaskFilter) {
    const buildQuery = () => {
      let query = this.client.from("tasks").select("*").order("id");
      if (filter?.projectId) query = query.eq("project_id", filter.projectId);
      if (filter?.assigneeId) query = query.eq("assignee_id", filter.assigneeId);
      if (filter?.status?.length) query = query.in("status", filter.status);
      if (filter?.search?.trim()) {
        const q = filter.search.trim();
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }
      return query;
    };

    if (filter?.offset !== undefined || filter?.limit !== undefined) {
      const offset = filter.offset ?? 0;
      const limit = filter.limit ?? 50;
      const { data, error } = await buildQuery().range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapTask);
    }

    return (
      await this.all((from, to) => buildQuery().range(from, to))
    ).map(mapTask);
  }

  async getTasksCount(filter?: TaskFilter): Promise<number> {
    let query = this.client
      .from("tasks")
      .select("id", { count: "exact", head: true });
    if (filter?.projectId) query = query.eq("project_id", filter.projectId);
    if (filter?.assigneeId) query = query.eq("assignee_id", filter.assigneeId);
    if (filter?.status?.length) query = query.in("status", filter.status);
    if (filter?.search?.trim()) {
      const q = filter.search.trim();
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  }
  async getTaskById(id: string) {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapTask(data) : null;
  }
  async createTask(dto: Parameters<ITrackerApi["createTask"]>[0]) {
    return mapTask(
      await this.mutate<TaskRow>("create_task", {
        project_id: dto.projectId,
        title: dto.title,
        description: dto.description,
        assignee_id: dto.assigneeId,
        complexity: dto.complexity,
        origin: dto.origin,
        due_date: dto.dueDate,
      }),
    );
  }
  async assignTask(
    taskId: string,
    assigneeId: string | null,
    _actorId: string,
  ) {
    return mapTask(
      await this.mutate<TaskRow>("assign_task", {
        task_id: taskId,
        assignee_id: assigneeId,
      }),
    );
  }
  async updateTaskStatus(
    taskId: string,
    status: Parameters<ITrackerApi["updateTaskStatus"]>[1],
    _actorId: string,
  ) {
    return mapTask(
      await this.mutate<TaskRow>("update_task_status", {
        task_id: taskId,
        status,
      }),
    );
  }
  async rescheduleTask(
    taskId: string,
    newDueDate: string,
    reason: string,
    _actorId: string,
  ) {
    return mapTask(
      await this.mutate<TaskRow>("reschedule_task", {
        task_id: taskId,
        due_date: newDueDate,
        reason,
      }),
    );
  }
  async submitTask(
    taskId: string,
    _actorId: string,
    notes?: string,
    deliverableUrl?: string,
  ) {
    return mapTask(
      await this.mutate<TaskRow>("submit_task", {
        task_id: taskId,
        notes: notes ?? null,
        deliverable_url: deliverableUrl ?? null,
      }),
    );
  }
  async acceptTask(taskId: string, _managerId: string) {
    return mapTask(
      await this.mutate<TaskRow>("accept_task", { task_id: taskId }),
    );
  }
  async returnTask(taskId: string, _managerId: string, reason: string) {
    return mapTask(
      await this.mutate<TaskRow>("return_task", { task_id: taskId, reason }),
    );
  }
  async getBlockers(taskId?: string) {
    return (
      await this.all((from, to) => {
        let query = this.client.from("blockers").select("*").order("id");
        if (taskId) query = query.eq("task_id", taskId);
        return query.range(from, to);
      })
    ).map(mapBlocker);
  }
  async raiseBlocker(dto: Parameters<ITrackerApi["raiseBlocker"]>[0]) {
    return mapBlocker(
      await this.mutate<BlockerRow>("raise_blocker", {
        task_id: dto.taskId,
        category: dto.category,
        description: dto.description,
        owner_id: dto.ownerId,
        blocking_task_id: dto.blockingTaskId ?? null,
      }),
    );
  }
  async clearBlocker(blockerId: string, _actorId: string) {
    return mapBlocker(
      await this.mutate<BlockerRow>("clear_blocker", { blocker_id: blockerId }),
    );
  }
  async getPersons() {
    return (
      await this.all((from, to) =>
        this.client.from("profiles").select("*").order("id").range(from, to),
      )
    ).map(mapProfile);
  }
  async getAvailability(personId?: string) {
    return (
      await this.all((from, to) => {
        let query = this.client.from("availability").select("*").order("id");
        if (personId) query = query.eq("person_id", personId);
        return query.range(from, to);
      })
    ).map(mapAvailability);
  }
  async recordAvailability(
    dto: Parameters<ITrackerApi["recordAvailability"]>[0],
  ) {
    return mapAvailability(
      await this.mutate<AvailabilityRow>("record_availability", {
        person_id: dto.personId,
        from_date: dto.fromDate,
        to_date: dto.toDate,
        note: dto.note,
      }),
    );
  }
  async createPerson(dto: Parameters<ITrackerApi["createPerson"]>[0]) {
    const { data, error } = await this.client.rpc("tracker_admin_mutate", {
      operation: "create_person",
      payload: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        title: dto.title ?? null,
        status: dto.status ?? "active",
      },
    });
    if (error) throw new Error(error.message);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("No person returned.");
    }
    return mapProfile(data as ProfileRow);
  }
  async updateProfile(dto: Parameters<ITrackerApi["updateProfile"]>[0]) {
    const { data, error } = await this.client.rpc("tracker_admin_mutate", {
      operation: "update_profile",
      payload: {
        person_id: dto.personId,
        name: dto.name,
        title: dto.title,
        avatar_url: dto.avatarUrl,
      },
    });
    if (error) throw new Error(error.message);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("No person returned.");
    }
    return mapProfile(data as ProfileRow);
  }
  async changeUserRole(dto: Parameters<ITrackerApi["changeUserRole"]>[0]) {
    const { data, error } = await this.client.rpc("tracker_admin_mutate", {
      operation: "change_role",
      payload: {
        person_id: dto.personId,
        role: dto.role,
      },
    });
    if (error) throw new Error(error.message);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("No person returned.");
    }
    return mapProfile(data as ProfileRow);
  }
  async setPersonStatus(dto: Parameters<ITrackerApi["setPersonStatus"]>[0]) {
    const { data, error } = await this.client.rpc("tracker_admin_mutate", {
      operation: "set_person_status",
      payload: {
        person_id: dto.personId,
        status: dto.status,
      },
    });
    if (error) throw new Error(error.message);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("No person returned.");
    }
    return mapProfile(data as ProfileRow);
  }
  async revokePersonSessions(
    dto: Parameters<ITrackerApi["revokePersonSessions"]>[0],
  ) {
    const { error } = await this.client.rpc("tracker_admin_mutate", {
      operation: "revoke_sessions",
      payload: {
        person_id: dto.personId,
      },
    });
    if (error) throw new Error(error.message);
  }
  async getLedger(filter?: LedgerFilter) {
    const buildQuery = () => {
      let query = this.client
        .from("ledger_records")
        .select("*")
        .order("occurred_at", { ascending: false })
        .order("id");
      if (filter?.subjectId) query = query.eq("subject_id", filter.subjectId);
      if (filter?.subjectType) query = query.eq("subject_type", filter.subjectType);
      if (filter?.actorId) query = query.eq("actor_id", filter.actorId);
      if (filter?.type) query = query.eq("type", filter.type);
      if (filter?.search?.trim()) {
        const q = filter.search.trim();
        query = query.or(`reason.ilike.%${q}%,type.ilike.%${q}%`);
      }
      return query;
    };

    if (filter?.offset !== undefined || filter?.limit !== undefined) {
      const offset = filter.offset ?? 0;
      const limit = filter.limit ?? 50;
      const { data, error } = await buildQuery().range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapLedger);
    }

    return (
      await this.all((from, to) => buildQuery().range(from, to))
    ).map(mapLedger);
  }
  async getLedgerCount(filter?: LedgerFilter): Promise<number> {
    let query = this.client
      .from("ledger_records")
      .select("id", { count: "exact", head: true });
    if (filter?.subjectId) query = query.eq("subject_id", filter.subjectId);
    if (filter?.subjectType) query = query.eq("subject_type", filter.subjectType);
    if (filter?.actorId) query = query.eq("actor_id", filter.actorId);
    if (filter?.type) query = query.eq("type", filter.type);
    if (filter?.search?.trim()) {
      const q = filter.search.trim();
      query = query.or(`reason.ilike.%${q}%,type.ilike.%${q}%`);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  }
  async getDerivedSignals(simulatedDate: string) {
    const [people, projects, tasks, blockers, availability, ledger] =
      await Promise.all([
        this.getPersons(),
        this.getProjects(),
        this.getTasks(),
        this.getBlockers(),
        this.getAvailability(),
        this.getLedger(),
      ]);
    return calculateOperationalSignals(
      people,
      projects,
      tasks,
      blockers,
      availability,
      ledger,
      simulatedDate,
    );
  }
  async resetToSeedData(): Promise<void> {
    throw new Error("Demo reset is disabled for Supabase.");
  }
  supportsDemoReset(): boolean {
    return false;
  }
}

