import { Badge, Button, Group, Table, Text } from "@mantine/core";
import { PersonLink } from "../atoms/PersonLink";
import { ProjectLink } from "../atoms/ProjectLink";
import { RagBadge } from "../atoms/RagBadge";
import type { Project } from "../../../../entities/project.entity";
import type { ProjectHealthSummary } from "../../../../entities/operational-signals.entity";

interface PortfolioRowProps {
  project: Project;
  managerName: string | null;
  summary?: ProjectHealthSummary;
  onProject: (id: string) => void;
  onPerson: (id: string) => void;
  onAssignLead: (projectId: string) => void;
}

export function PortfolioRow({
  project,
  managerName,
  summary,
  onProject,
  onPerson,
  onAssignLead,
}: PortfolioRowProps) {
  return (
    <Table.Tr>
      <Table.Td>
        <ProjectLink name={project.name} onClick={() => onProject(project.id)} />
        <Text size="xs" c="dimmed" lineClamp={2}>
          {project.goal}
        </Text>
      </Table.Td>
      <Table.Td>
        {project.managerId && managerName ? (
          <PersonLink
            name={managerName}
            onClick={() => onPerson(project.managerId!)}
          />
        ) : (
          <Badge color="red">Unmanaged</Badge>
        )}
      </Table.Td>
      <Table.Td>{project.targetDate}</Table.Td>
      <Table.Td>
        <RagBadge status={summary?.ragStatus} closed={project.state === "closed"} />
      </Table.Td>
      <Table.Td>
        {summary?.openTasksCount ?? 0} / {summary?.overdueTasksCount ?? 0} /{" "}
        {summary?.blockedTasksCount ?? 0}
      </Table.Td>
      <Table.Td>{summary?.slipCount ?? 0}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={() => onProject(project.id)}>
            Inspect
          </Button>
          {project.state === "active" && (
            <Button
              size="xs"
              variant="subtle"
              onClick={() => onAssignLead(project.id)}
            >
              Assign lead
            </Button>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
