import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "../../services";
import { queryKeys } from "../query-keys";
import { TaskStatus } from "../../entities/task.entity";
import { CreateTaskDto } from "../../dtos/create-task.dto";
import { RescheduleTaskDto } from "../../dtos/reschedule-task.dto";

export function useTasks(filter?: {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus[];
}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filter),
    queryFn: () => taskService.getTasks(filter),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => taskService.createTask(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      status,
      actorId,
    }: {
      taskId: string;
      status: TaskStatus;
      actorId: string;
    }) => taskService.updateTaskStatus(taskId, status, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useRescheduleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RescheduleTaskDto) =>
      taskService.rescheduleTask(
        dto.taskId,
        dto.newDueDate,
        dto.reason,
        dto.actorId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      assigneeId,
      actorId,
    }: {
      taskId: string;
      assigneeId: string | null;
      actorId: string;
    }) => taskService.assignTask(taskId, assigneeId, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useSubmitTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      actorId,
      notes,
      deliverableUrl,
    }: {
      taskId: string;
      actorId: string;
      notes?: string;
      deliverableUrl?: string;
    }) => taskService.submitTask(taskId, actorId, notes, deliverableUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useAcceptTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      managerId,
    }: {
      taskId: string;
      managerId: string;
    }) => taskService.acceptTask(taskId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useReturnTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      managerId,
      reason,
    }: {
      taskId: string;
      managerId: string;
      reason: string;
    }) => taskService.returnTask(taskId, managerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}
