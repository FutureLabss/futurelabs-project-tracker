import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projectService,
  taskService,
  peopleService,
  blockerService,
  reportingService,
} from "../../services";
import type { AttentionItem } from "../../entities/operational-signals.entity";
import type { LedgerRecord } from "../../entities/ledger-record.entity";
import type { Person } from "../../entities/person.entity";

export interface ManagerAttentionItem extends AttentionItem {}

export interface ManagerLedgerRecord extends LedgerRecord {
  actorName?: string;
  eventType: LedgerRecord["type"];
}

export interface ManagerAcceptanceItem {
  id: string;
  taskId: string;
  deliverable: string;
  description: string;
  projectName: string;
  submittedBy: string;
  complexity: string;
  points: number;
}

export interface ManagerTeamMember {
  id: string;
  name: string;
  title: string;
  points: number;
  activeTasks: number;
  overdueTasks: number;
  onLeave: boolean;
  capacityPercentage: number;
}

export interface ManagerMetrics {
  criticalExceptions: number;
  reviewGateSubmissions: number;
  activeProjects: number;
  teamEngineers: number;
}

export function useManagerWorkspace(
  personIdOrDate: string,
  maybeDate?: string,
) {
  const date = maybeDate ?? personIdOrDate;
  const resolvedPersonId = maybeDate ? personIdOrDate : undefined;

  return useQuery({
    queryKey: ["manager-workspace", date],
    queryFn: async () => {
      const [projects, tasks, people, blockers, availability, ledger, members] =
        await Promise.all([
          projectService.getProjects(),
          taskService.getTasks(),
          peopleService.getPersons(),
          blockerService.getBlockers(),
          peopleService.getAvailability(),
          reportingService.getLedger(),
          projectService.getProjectMembers(),
        ]);

      const signals = reportingService.summarize(
        { projects, tasks, people, blockers, availability, ledger },
        date,
      );

      const personLookup = new Map<string, Person>(
        people.map((person) => [person.id, person]),
      );
      const managerName =
        (resolvedPersonId
          ? personLookup.get(resolvedPersonId)?.name
          : undefined) ?? "Manager";

      const normalizedLedger: ManagerLedgerRecord[] = ledger.map((record) => ({
        ...record,
        actorName: personLookup.get(record.actorId)?.name ?? "System",
        eventType: record.type,
      }));

      const attentionItems: ManagerAttentionItem[] = signals.attentionItems.map(
        (item) => ({
          ...item,
          taskId: item.taskId ?? undefined,
          projectId: item.projectId ?? undefined,
          taskTitle: item.taskTitle ?? item.headline,
          assigneeName: item.assigneeName ?? "Unassigned",
          projectName: item.projectName ?? "Unknown Project",
        }),
      );

      const acceptanceItems: ManagerAcceptanceItem[] = tasks
        .filter((task) => task.status === "submitted")
        .map((task) => {
          const project = projects.find((entry) => entry.id === task.projectId);
          const assignee = task.assigneeId
            ? personLookup.get(task.assigneeId)
            : undefined;

          return {
            id: task.id,
            taskId: task.id,
            deliverable: task.title,
            description:
              task.description ?? "Submitted deliverable pending review.",
            projectName: project?.name ?? "Unknown Project",
            submittedBy: assignee?.name ?? "Unassigned",
            complexity: String(task.complexity ?? "mid"),
            points:
              task.complexity === "low" ? 1 : task.complexity === "mid" ? 2 : 3,
          };
        });

      const teamMembers: ManagerTeamMember[] = people
        .filter((person) => person.role !== "admin")
        .map((person) => {
          const memberTasks = tasks.filter(
            (task) =>
              task.assigneeId === person.id &&
              task.status !== "accepted" &&
              task.status !== "cancelled",
          );
          const overdueTasks = memberTasks.filter(
            (task) =>
              task.dueDate &&
              new Date(task.dueDate).getTime() < new Date(date).getTime(),
          ).length;
          const points = memberTasks.reduce(
            (sum, task) =>
              sum +
              (task.complexity === "high"
                ? 3
                : task.complexity === "mid"
                  ? 2
                  : 1),
            0,
          );
          const capacityPercentage = Math.max(
            0,
            Math.min(100, 100 - overdueTasks * 10 + memberTasks.length * 5),
          );

          const currentDate = new Date(date);
          const onLeave = availability.some((entry) => {
            if (entry.personId !== person.id) return false;
            const from = new Date(entry.fromDate);
            const to = new Date(entry.toDate);
            return currentDate >= from && currentDate <= to;
          });

          return {
            id: person.id,
            name: person.name,
            title: person.title ?? "Engineer",
            points,
            activeTasks: memberTasks.length,
            overdueTasks,
            onLeave,
            capacityPercentage,
          };
        });

      const metrics: ManagerMetrics = {
        criticalExceptions: signals.attentionItems.filter(
          (item) => item.severity === "critical",
        ).length,
        reviewGateSubmissions: tasks.filter(
          (task) => task.status === "submitted",
        ).length,
        activeProjects: projects.filter((project) => project.state === "active")
          .length,
        teamEngineers: people.filter((person) => person.role !== "admin")
          .length,
      };

      return {
        projects,
        tasks,
        people,
        blockers,
        availability,
        ledger: normalizedLedger,
        members,
        signals,
        managerName,
        attentionItems,
        acceptanceItems,
        teamMembers,
        metrics,
        sourceData: {
          projects,
          tasks,
          people,
          blockers,
          availability,
          ledger: normalizedLedger,
          members,
          signals,
        },
      };
    },
  });
}

export type ManagerWorkspace = NonNullable<
  ReturnType<typeof useManagerWorkspace>["data"]
>;

export function useManagerAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      await Promise.all(
        [
          "manager-workspace",
          "admin-workspace",
          "projects",
          "tasks",
          "persons",
          "blockers",
          "availability",
          "ledger",
          "signals",
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
    },
  });
}
