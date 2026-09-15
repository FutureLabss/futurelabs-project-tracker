import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projectService,
  taskService,
  peopleService,
  blockerService,
  reportingService,
} from "../../services";

export function useAdminWorkspace(date: string) {
  return useQuery({
    queryKey: ["admin-workspace", date],
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
      return {
        projects,
        tasks,
        people,
        blockers,
        availability,
        ledger,
        members,
        signals: reportingService.summarize(
          { projects, tasks, people, blockers, availability, ledger },
          date,
        ),
      };
    },
  });
}
export type AdminWorkspace = NonNullable<
  ReturnType<typeof useAdminWorkspace>["data"]
>;

export function useAdminAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      await Promise.all(
        [
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
