import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { peopleService } from "../../services";
import { queryKeys } from "../query-keys";
import { RecordLeaveDto } from "../../dtos/record-leave.dto";

export function usePersons() {
  return useQuery({
    queryKey: queryKeys.persons.all,
    queryFn: () => peopleService.getPersons(),
  });
}

export function useAvailability(personId?: string) {
  return useQuery({
    queryKey: queryKeys.availability.byPerson(personId),
    queryFn: () => peopleService.getAvailability(personId),
  });
}

export function useRecordLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RecordLeaveDto) => peopleService.recordAvailability(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}
