import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../../services";
import { queryKeys } from "../query-keys";
import { CreateProjectDto } from "../../dtos/create-project.dto";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => projectService.getProjects(),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProjectDto) => projectService.createProject(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useAssignProjectManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      managerId,
      actorId,
    }: {
      projectId: string;
      managerId: string | null;
      actorId: string;
    }) => projectService.assignProjectManager(projectId, managerId, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}
