import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { projectService, taskService } from "../../services";
import type { TaskComplexity } from "../../entities/task.entity";
import type { CreateProjectDto } from "../../dtos/create-project.dto";

// Every view the manager page reads from, including its own aggregate query.
const MANAGER_AFFECTED_KEYS = [
  "manager-workspace",
  "admin-workspace",
  "projects",
  "tasks",
  "persons",
  "blockers",
  "availability",
  "ledger",
  "signals",
];

export function invalidateManagerQueries(client: QueryClient) {
  return Promise.all(
    MANAGER_AFFECTED_KEYS.map((key) => client.invalidateQueries({ queryKey: [key] })),
  );
}

function useManagerMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateManagerQueries(client),
  });
}

// FR-20
export function useCreateManagedProject() {
  return useManagerMutation((dto: Omit<CreateProjectDto, "managerId">) =>
    projectService.createManagedProject(dto),
  );
}

// FR-21
export function useCloseManagedProject() {
  return useManagerMutation(({ projectId, actorId }: { projectId: string; actorId: string }) =>
    projectService.closeManagedProject(projectId, actorId),
  );
}

// FR-24
export function useReassignTask() {
  return useManagerMutation(
    ({ taskId, assigneeId, actorId }: { taskId: string; assigneeId: string | null; actorId: string }) =>
      taskService.assignTask(taskId, assigneeId, actorId),
  );
}

// FR-26
export function useChangeTaskComplexity() {
  return useManagerMutation(
    ({
      taskId,
      complexity,
      actorId,
      reason,
    }: {
      taskId: string;
      complexity: TaskComplexity;
      actorId: string;
      reason?: string;
    }) => taskService.changeTaskComplexity(taskId, complexity, actorId, reason),
  );
}

// FR-27
export function useCancelTask() {
  return useManagerMutation(({ taskId, actorId }: { taskId: string; actorId: string }) =>
    taskService.updateTaskStatus(taskId, "cancelled", actorId),
  );
}

// FR-30
export function useReopenTask() {
  return useManagerMutation(
    ({ taskId, actorId, reason }: { taskId: string; actorId: string; reason: string }) =>
      taskService.reopenTask(taskId, actorId, reason),
  );
}

// FR-28 / FR-29 / FR-43: same review actions, but refreshing the manager workspace too.
export function useManagerAcceptTask() {
  return useManagerMutation(({ taskId, actorId }: { taskId: string; actorId: string }) =>
    taskService.acceptTask(taskId, actorId),
  );
}

export function useManagerReturnTask() {
  return useManagerMutation(
    ({ taskId, actorId, reason }: { taskId: string; actorId: string; reason: string }) =>
      taskService.returnTask(taskId, actorId, reason),
  );
}
