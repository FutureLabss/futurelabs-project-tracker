import { Badge, Card, Group, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconBellOff, IconZzz } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { InactiveProjectRow, UnattendedTaskRow } from "../../../../domain/calculations/admin-insights";
import { SYSTEM_CONFIG } from "../../../../domain/config/system-thresholds";

interface RiskWatchlistsProps {
  unattended: UnattendedTaskRow[];
  inactive: InactiveProjectRow[];
  projectName: (id: string) => string;
  personName: (id: string | null) => string;
  onTask: (id: string) => void;
  onProject: (id: string) => void;
}

const day = (timestamp: string) => dayjs(timestamp).format("YYYY-MM-DD");

/** FR-54 unattended work and FR-55 inactive projects, side by side on the Risks view. */
export function RiskWatchlists({ unattended, inactive, projectName, personName, onTask, onProject }: RiskWatchlistsProps) {
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
      <Card withBorder radius="md" p="md">
        <Group gap="xs" mb={4}>
          <IconBellOff size={18} color="var(--mantine-color-red-6)" />
          <Text fw={700}>Unattended work ({unattended.length})</Text>
        </Group>
        <Text size="xs" c="dimmed" mb="sm">
          Blocked, or in progress longer than expected, and nobody but the assignee has changed it for{" "}
          {SYSTEM_CONFIG.UNATTENDED_WORKING_DAYS}+ working days.
        </Text>
        <Stack gap={6}>
          {unattended.length === 0 && (
            <Text size="sm" c="dimmed">
              Nothing is waiting unattended.
            </Text>
          )}
          {unattended.map((row) => (
            <UnstyledButton key={row.task.id} onClick={() => onTask(row.task.id)}>
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {row.task.title}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {projectName(row.task.projectId)} · {personName(row.task.assigneeId)} · last outside change{" "}
                    {day(row.lastOtherActionAt)}
                  </Text>
                </Stack>
                <Group gap={4} wrap="nowrap">
                  <Badge size="xs" variant="light" color={row.reason === "blocked" ? "red" : "orange"}>
                    {row.reason === "blocked" ? "Blocked" : "Aging"}
                  </Badge>
                  <Badge size="xs" variant="outline" color="gray">
                    {row.workingDaysUnattended}d
                  </Badge>
                </Group>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      </Card>

      <Card withBorder radius="md" p="md">
        <Group gap="xs" mb={4}>
          <IconZzz size={18} color="var(--mantine-color-gray-6)" />
          <Text fw={700}>Inactive projects ({inactive.length})</Text>
        </Group>
        <Text size="xs" c="dimmed" mb="sm">
          Active projects with no recorded change for more than {SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS} working
          days.
        </Text>
        <Stack gap={6}>
          {inactive.length === 0 && (
            <Text size="sm" c="dimmed">
              Every active project has recent activity.
            </Text>
          )}
          {inactive.map((row) => (
            <UnstyledButton key={row.project.id} onClick={() => onProject(row.project.id)}>
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {row.project.name}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    Lead: {personName(row.project.managerId)} · last change {day(row.lastActivityAt)}
                  </Text>
                </Stack>
                <Badge size="xs" variant="outline" color="gray">
                  {row.workingDaysInactive}d
                </Badge>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      </Card>
    </SimpleGrid>
  );
}
