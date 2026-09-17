import { Card, SimpleGrid, Stack, Title } from "@mantine/core";
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
    <>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder>
          <Title order={2} size="h4">
            Projects without a lead
          </Title>
          <Stack mt="md">
            {unmanagedProjects.map((p) => (
              <UnmanagedProjectRow
                key={p.id}
                project={p}
                onProject={onProject}
                onAssignLead={onAssignLead}
              />
            ))}
            {!unmanagedProjects.length && (
              <EmptyState message="No unmanaged projects match this view." />
            )}
          </Stack>
        </Card>
        <LeadCoverageCard
          activeProjectsCount={activeProjectsCount}
          managedProjectsCount={managedProjectsCount}
          onManageProjects={() => onChangeView("portfolio")}
        />
      </SimpleGrid>
      <Card withBorder>
        <Title order={2} size="h4" mb="md">
          Unassigned open work
        </Title>
        <TaskList tasks={unassignedTasks} data={data} onTask={onTask} />
      </Card>
      <Card withBorder>
        <Title order={2} size="h4" mb="md">
          Deliverables awaiting review
        </Title>
        <TaskList tasks={submittedTasks} data={data} onTask={onTask} />
      </Card>
    </>
  );
}
