import { useTasks } from "./use-tasks";
import { useProjects } from "./use-projects";
import { usePersons } from "./use-availability";
import type { MemberTask } from "../../types/member-task";

export function useMemberWork(personId: string, date: string) {
  const taskQuery = useTasks();
  const projectQuery = useProjects();
  const peopleQuery = usePersons();
  const projects = new Map(
    projectQuery.data?.map((project) => [project.id, project.name]),
  );
  const people = new Map(
    peopleQuery.data?.map((person) => [person.id, person]),
  );
  const tasks = taskQuery.data ?? [];
  const personalTasks = tasks
    .filter((task) => task.assigneeId === personId)
    .map((task) => ({
      ...task,
      project: projects.get(task.projectId) ?? "Unknown project",
    }));
  const teamTasks: MemberTask[] = tasks
    .filter(
      (task) =>
        task.assigneeId !== personId &&
        task.status !== "accepted" &&
        task.status !== "cancelled",
    )
    .map((task) => {
      const assignee = task.assigneeId
        ? people.get(task.assigneeId)
        : undefined;
      return {
        ...task,
        assignee: assignee?.name ?? "UNASSIGNED",
        assigneeInitial: assignee?.name.charAt(0),
        assigneeRole: assignee?.role,
        project: projects.get(task.projectId) ?? "Unknown project",
        complexity: task.complexity.toUpperCase() as MemberTask["complexity"],
        points: { low: 1, mid: 2, high: 3 }[task.complexity],
        status: task.status
          .replaceAll("_", " ")
          .toUpperCase() as MemberTask["status"],
        overdue: task.dueDate < date,
        accessMode: "INSPECT (READ-ONLY)",
      };
    });
  return {
    personalTasks,
    teamTasks,
    isPending:
      taskQuery.isPending || projectQuery.isPending || peopleQuery.isPending,
    error: taskQuery.error ?? projectQuery.error ?? peopleQuery.error,
  };
}
