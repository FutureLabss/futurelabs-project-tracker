import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportingService, demoService } from "../../services";
import { queryKeys } from "../query-keys";

export function useSignals(simulatedDate: string) {
  return useQuery({
    queryKey: queryKeys.signals.forDate(simulatedDate),
    queryFn: () => reportingService.getDerivedSignals(simulatedDate),
    staleTime: 1000,
  });
}

export function useResetToSeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => demoService.resetToSeedData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
