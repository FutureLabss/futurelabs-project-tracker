import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blockerService } from "../../services";
import { queryKeys } from "../query-keys";
import { RaiseBlockerDto } from "../../dtos/raise-blocker.dto";

export function useBlockers(taskId?: string) {
  return useQuery({
    queryKey: queryKeys.blockers.byTask(taskId),
    queryFn: () => blockerService.getBlockers(taskId),
  });
}

export function useRaiseBlocker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RaiseBlockerDto) => blockerService.raiseBlocker(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useClearBlocker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      blockerId,
      actorId,
    }: {
      blockerId: string;
      actorId: string;
    }) => blockerService.clearBlocker(blockerId, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}
