import { useQuery } from "@tanstack/react-query";
import { reportingService } from "../../services";
import { queryKeys } from "../query-keys";

export function useLedger(filter?: { subjectId?: string; actorId?: string }) {
  return useQuery({
    queryKey: queryKeys.ledger.filtered(filter),
    queryFn: () => reportingService.getLedger(filter),
  });
}
