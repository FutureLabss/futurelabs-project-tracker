import {
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Progress,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCalendar,
  IconClock,
  IconUser,
  IconUserExclamation,
} from "@tabler/icons-react";
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
  const totalTasks = summary?.totalTasks ?? 0;
  const openTasks = summary?.openTasksCount ?? 0;
  const completedTasks = Math.max(0, totalTasks - openTasks);
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const overdue = summary?.overdueTasksCount ?? 0;
  const blocked = summary?.blockedTasksCount ?? 0;
  const isClosed = project.state === "closed";

  return (
    <Table.Tr style={{ opacity: isClosed ? 0.75 : 1 }}>
      {/* Project & Scope */}
      <Table.Td style={{ minWidth: 260, maxWidth: 360 }}>
        <Group gap="xs" wrap="nowrap" align="center">
          <Box style={{ minWidth: 0 }}>
            <Group gap={6} wrap="nowrap">
              <ProjectLink
                name={project.name}
                onClick={() => onProject(project.id)}
              />
              {isClosed && (
                <Badge size="xs" variant="outline" color="gray">
                  Closed
                </Badge>
              )}
            </Group>
            {project.goal && (
              <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                {project.goal}
              </Text>
            )}
          </Box>
        </Group>
      </Table.Td>

      {/* Accountable Lead */}
      <Table.Td style={{ minWidth: 150 }}>
        {project.managerId && managerName ? (
          <Group gap={6} wrap="nowrap">
            <Avatar size="xs" radius="xl" color="teal">
              {managerName.slice(0, 2).toUpperCase()}
            </Avatar>
            <PersonLink
              name={managerName}
              onClick={() => onPerson(project.managerId!)}
            />
          </Group>
        ) : (
          <Badge
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconUserExclamation size={11} />}
          >
            No Lead
          </Badge>
        )}
      </Table.Td>

      {/* Delivery Progress */}
      <Table.Td style={{ minWidth: 160 }}>
        <Box style={{ width: 140 }}>
          <Group justify="space-between" mb={3}>
            <Text size="xs" c="dimmed">
              {completedTasks}/{totalTasks} done
            </Text>
            <Text size="xs" fw={600}>
              {progressPercent}%
            </Text>
          </Group>
          <Progress
            value={progressPercent}
            size="xs"
            radius="xl"
            color={
              progressPercent === 100
                ? "teal"
                : summary?.ragStatus === "red"
                  ? "red"
                  : summary?.ragStatus === "amber"
                    ? "orange"
                    : "teal"
            }
          />
        </Box>
      </Table.Td>

      {/* RAG Health */}
      <Table.Td style={{ minWidth: 110 }}>
        {/* FR-53: what caused the rating, without opening the project */}
        <Tooltip
          multiline
          w={320}
          withArrow
          disabled={isClosed || !summary?.ragReasons.length}
          label={
            <Stack gap={2}>
              {summary?.ragReasons.map((reason) => (
                <Text key={reason} size="xs">
                  • {reason}
                </Text>
              ))}
            </Stack>
          }
        >
          <Stack gap={2} style={{ cursor: "help" }}>
            <RagBadge status={summary?.ragStatus} closed={isClosed} />
            {!isClosed && summary?.ragStatus !== "green" && summary?.ragReasons[0] && (
              <Text size="xs" c="dimmed" lineClamp={2} maw={220}>
                {summary.ragReasons[0]}
                {summary.ragReasons.length > 1 ? ` (+${summary.ragReasons.length - 1} more)` : ""}
              </Text>
            )}
          </Stack>
        </Tooltip>
      </Table.Td>

      {/* Tasks & Risks Breakdown */}
      <Table.Td style={{ minWidth: 180 }}>
        <Group gap={4} wrap="wrap">
          <Badge size="xs" variant="light" color="gray">
            {openTasks} open
          </Badge>
          {overdue > 0 && (
            <Badge
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconClock size={10} />}
            >
              {overdue} overdue
            </Badge>
          )}
          {blocked > 0 && (
            <Badge
              size="xs"
              variant="light"
              color="orange"
              leftSection={<IconAlertTriangle size={10} />}
            >
              {blocked} blocked
            </Badge>
          )}
        </Group>
      </Table.Td>

      {/* Target Date */}
      <Table.Td style={{ minWidth: 120 }}>
        <Tooltip label={`Target Date: ${project.targetDate}`} withArrow>
          <Group gap={4} wrap="nowrap" c="dimmed">
            <IconCalendar size={13} />
            <Text size="xs">{project.targetDate}</Text>
          </Group>
        </Tooltip>
      </Table.Td>

      {/* Row Actions */}
      <Table.Td style={{ minWidth: 140 }}>
        <Group gap="xs" wrap="nowrap">
          <Button
            size="xs"
            variant="light"
            color="teal"
            onClick={() => onProject(project.id)}
          >
            Inspect
          </Button>
          {project.state === "active" && (
            <Button
              size="xs"
              variant="subtle"
              color={project.managerId ? "gray" : "orange"}
              leftSection={project.managerId ? undefined : <IconUser size={12} />}
              onClick={() => onAssignLead(project.id)}
            >
              {project.managerId ? "Reassign" : "Lead"}
            </Button>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
