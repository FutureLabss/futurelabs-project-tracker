import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Progress,
  Stack,
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
import { ProjectLink } from "../atoms/ProjectLink";
import { RagBadge } from "../atoms/RagBadge";
import type { Project } from "../../../../entities/project.entity";
import type { ProjectHealthSummary } from "../../../../entities/operational-signals.entity";

interface PortfolioCardProps {
  project: Project;
  managerName: string | null;
  summary?: ProjectHealthSummary;
  onProject: (id: string) => void;
  onPerson: (id: string) => void;
  onAssignLead: (projectId: string) => void;
}

export function PortfolioCard({
  project,
  managerName,
  summary,
  onProject,
  onPerson,
  onAssignLead,
}: PortfolioCardProps) {
  const totalTasks = summary?.totalTasks ?? 0;
  const openTasks = summary?.openTasksCount ?? 0;
  const completedTasks = Math.max(0, totalTasks - openTasks);
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const overdue = summary?.overdueTasksCount ?? 0;
  const blocked = summary?.blockedTasksCount ?? 0;
  const isClosed = project.state === "closed";

  const getBorderColor = () => {
    if (isClosed) return "var(--mantine-color-gray-4)";
    if (summary?.ragStatus === "red") return "var(--mantine-color-red-6)";
    if (summary?.ragStatus === "amber") return "var(--mantine-color-orange-6)";
    return "var(--mantine-color-teal-6)";
  };

  return (
    <Card
      withBorder
      shadow="xs"
      radius="md"
      p="md"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderTop: `4px solid ${getBorderColor()}`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <Stack gap="sm">
        {/* Top Header Row */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <ProjectLink
              name={project.name}
              onClick={() => onProject(project.id)}
            />
            {project.goal && (
              <Text size="xs" c="dimmed" lineClamp={2} mt={3}>
                {project.goal}
              </Text>
            )}
          </Box>
          <RagBadge status={summary?.ragStatus} closed={isClosed} />
        </Group>
        {!isClosed && summary?.ragStatus !== "green" && summary?.ragReasons.length ? (
          <Text size="xs" c="dimmed" lineClamp={3}>
            {summary.ragReasons.join(" · ")}
          </Text>
        ) : null}

        {/* Progress Bar */}
        <Box mt={4}>
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600} c="dimmed">
              Delivery Progress
            </Text>
            <Text size="xs" fw={700}>
              {completedTasks}/{totalTasks} tasks ({progressPercent}%)
            </Text>
          </Group>
          <Progress
            value={progressPercent}
            color={
              progressPercent === 100
                ? "teal"
                : summary?.ragStatus === "red"
                  ? "red"
                  : summary?.ragStatus === "amber"
                    ? "orange"
                    : "teal"
            }
            size="sm"
            radius="xl"
            animated={progressPercent > 0 && progressPercent < 100}
          />
        </Box>

        {/* Status Indicators Pill Row */}
        <Group gap={6} wrap="wrap">
          <Badge size="xs" variant="light" color="gray">
            {openTasks} open
          </Badge>

          {overdue > 0 && (
            <Badge
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconClock size={11} />}
            >
              {overdue} overdue
            </Badge>
          )}

          {blocked > 0 && (
            <Badge
              size="xs"
              variant="light"
              color="orange"
              leftSection={<IconAlertTriangle size={11} />}
            >
              {blocked} blocked
            </Badge>
          )}

          {(summary?.slipCount ?? 0) > 0 && (
            <Badge size="xs" variant="outline" color="yellow">
              {summary!.slipCount} slips
            </Badge>
          )}
        </Group>

        {/* Lead & Target Meta */}
        <Group justify="space-between" align="center" mt="xs" wrap="nowrap">
          <Box>
            {project.managerId && managerName ? (
              <Group
                gap={6}
                wrap="nowrap"
                style={{ cursor: "pointer" }}
                onClick={() => onPerson(project.managerId!)}
              >
                <Avatar size="xs" radius="xl" color="teal">
                  {managerName.slice(0, 2).toUpperCase()}
                </Avatar>
                <Text size="xs" fw={500} truncate="end" maw={110}>
                  {managerName}
                </Text>
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
          </Box>

          <Tooltip label={`Target Date: ${project.targetDate}`} withArrow>
            <Group gap={4} wrap="nowrap" c="dimmed">
              <IconCalendar size={13} />
              <Text size="xs">{project.targetDate}</Text>
            </Group>
          </Tooltip>
        </Group>
      </Stack>

      {/* Action Footer */}
      <Group justify="space-between" mt="md" pt="sm" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
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
            {project.managerId ? "Reassign" : "Assign lead"}
          </Button>
        )}
      </Group>
    </Card>
  );
}
