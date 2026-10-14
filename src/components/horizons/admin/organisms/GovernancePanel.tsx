import {
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconChecklist,
  IconClockHour4,
  IconShieldCheck,
  IconUserX,
} from "@tabler/icons-react";
import { UnmanagedProjectRow } from "../molecules/UnmanagedProjectRow";
import { LeadCoverageCard } from "../molecules/LeadCoverageCard";
import { TaskList } from "../AdminDetails";
import { EmptyState } from "../atoms/EmptyState";
import type { Project } from "../../../../entities/project.entity";
import type { Task } from "../../../../entities/task.entity";
import type { AdminWorkspace } from "../../../../api/hooks/use-admin-workspace";
import type { AdminView } from "../../../../types/dashboard";

interface GovernancePanelProps {
  data: AdminWorkspace;
  unmanagedProjects: Project[];
  activeProjectsCount: number;
  managedProjectsCount: number;
  unassignedTasks: Task[];
  submittedTasks: Task[];
  onProject: (id: string) => void;
  onTask: (id: string) => void;
  onAssignLead: (projectId: string) => void;
  onChangeView: (view: AdminView) => void;
}

export function GovernancePanel({
  data,
  unmanagedProjects,
  activeProjectsCount,
  managedProjectsCount,
  unassignedTasks,
  submittedTasks,
  onProject,
  onTask,
  onAssignLead,
  onChangeView,
}: GovernancePanelProps) {
  return (
    <Stack gap="md">
      {/* Top Governance Grid: Lead Coverage & Unmanaged Projects */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <ThemeIcon
                size="md"
                radius="md"
                variant="light"
                color={unmanagedProjects.length ? "orange" : "teal"}
              >
                {unmanagedProjects.length ? (
                  <IconUserX size={18} />
                ) : (
                  <IconShieldCheck size={18} />
                )}
              </ThemeIcon>
              <div>
                <Text fw={600} size="sm">
                  Projects without a lead
                </Text>
                <Text size="xs" c="dimmed">
                  Active projects requiring a designated manager
                </Text>
              </div>
            </Group>
            <Badge
              color={unmanagedProjects.length ? "orange" : "teal"}
              variant="light"
              size="sm"
            >
              {unmanagedProjects.length} attention
            </Badge>
          </Group>

          <Stack gap="xs" mt="sm">
            {unmanagedProjects.map((p) => (
              <UnmanagedProjectRow
                key={p.id}
                project={p}
                onProject={onProject}
                onAssignLead={onAssignLead}
              />
            ))}
            {!unmanagedProjects.length && (
              <EmptyState message="All active projects have designated leadership." />
            )}
          </Stack>
        </Card>

        <LeadCoverageCard
          activeProjectsCount={activeProjectsCount}
          managedProjectsCount={managedProjectsCount}
          onManageProjects={() => onChangeView("portfolio")}
        />
      </SimpleGrid>

      {/* Unassigned Work Section */}
      <Card withBorder p="lg" radius="md">
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <ThemeIcon size="md" radius="md" variant="light" color="blue">
              <IconChecklist size={18} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                Unassigned open work
              </Text>
              <Text size="xs" c="dimmed">
                Active tasks without an assigned contributor
              </Text>
            </div>
          </Group>
          <Badge
            color={unassignedTasks.length ? "blue" : "gray"}
            variant="light"
            size="sm"
          >
            {unassignedTasks.length} unassigned
          </Badge>
        </Group>

        <TaskList tasks={unassignedTasks} data={data} onTask={onTask} />
      </Card>

      {/* Review Queue Section */}
      <Card withBorder p="lg" radius="md">
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <ThemeIcon size="md" radius="md" variant="light" color="violet">
              <IconClockHour4 size={18} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="sm">
                Deliverables awaiting review
              </Text>
              <Text size="xs" c="dimmed">
                Submitted work items pending quality inspection or acceptance
              </Text>
            </div>
          </Group>
          <Badge
            color={submittedTasks.length ? "violet" : "gray"}
            variant="light"
            size="sm"
          >
            {submittedTasks.length} in review
          </Badge>
        </Group>

        <TaskList tasks={submittedTasks} data={data} onTask={onTask} />
      </Card>
    </Stack>
  );
}
