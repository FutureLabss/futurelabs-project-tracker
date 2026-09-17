import { Button, Group } from "@mantine/core";
import { ProjectLink } from "../atoms/ProjectLink";
import type { Project } from "../../../../entities/project.entity";

interface UnmanagedProjectRowProps {
  project: Project;
  onProject: (id: string) => void;
  onAssignLead: (projectId: string) => void;
}

export function UnmanagedProjectRow({
  project,
  onProject,
  onAssignLead,
}: UnmanagedProjectRowProps) {
  return (
    <Group justify="space-between">
      <ProjectLink name={project.name} onClick={() => onProject(project.id)} />
      <Button size="xs" onClick={() => onAssignLead(project.id)}>
        Assign lead
      </Button>
    </Group>
  );
}
