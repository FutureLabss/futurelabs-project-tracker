import {
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';

import {
  IconClipboardList,
  IconClock,
  IconFlame,
  IconTrophy,
  IconUser,
} from '@tabler/icons-react';

import { MetricCard } from './atoms/MetricCard';
import { PersonalTasksTable } from './organisms/PersonalTasksTable';
import { SharedProjectsTable } from './organisms/SharedProjectsTable';
import { AcceptedDeliverablesTable } from './organisms/AcceptedDeliverablesTable';
import { MemberPageHeader } from './molecules/MemberPageHeader';
import { MemberTemplate } from './templates/MemberTemplate';
import { MemberView } from '../../../types/dashboard';
import { useTasks } from '../../../api/hooks/use-tasks';
import { ProjectDetailsView } from './ProjectDetailsView';
import { useState, useEffect } from 'react';


interface MemberDashboardProps {
  personId:string;
  personName?:string;
  memberView: MemberView;
}

export default function MemberDashboard({personId, personName, memberView}:MemberDashboardProps) {

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    setActiveProjectId(null);
  }, [memberView]);

  const { data: tasks = [] } = useTasks({ assigneeId: personId });

  const activeTasks = tasks.filter((t) => t.status !== 'accepted' && t.status !== 'cancelled');
  const activeTasksCount = activeTasks.length;

  const getComplexityPoints = (complexity: string) => {
    const c = complexity.toLowerCase();
    if (c === 'high') return 3;
    if (c === 'mid') return 2;
    if (c === 'low') return 1;
    return 0;
  };

  const sizeWeightedLoad = activeTasks.reduce((acc, t) => acc + getComplexityPoints(t.complexity), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasksCount = activeTasks.filter((t) => t.dueDate < todayStr).length;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const acceptedThisMonthTasks = tasks.filter(
    (t) => t.status === 'accepted' && t.acceptedAt?.startsWith(currentMonth)
  );
  const acceptedThisMonthCount = acceptedThisMonthTasks.length;
  const acceptedThisMonthPts = acceptedThisMonthTasks.reduce((acc, t) => acc + getComplexityPoints(t.complexity), 0);

  return (
    <MemberTemplate
      header={
        !activeProjectId && (
          <MemberPageHeader
            personName={personName}
            personId={personId}
            memberView={memberView}
          />
        )
      }
      metricsGrid={
        !activeProjectId && memberView !== 'completed' ? (
          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
              lg: 4,
            }}
          >
            <MetricCard
              title="Active Tasks"
              value={activeTasksCount}
              description="In queue"
              color="blue"
              icon={<IconClipboardList size={18} />}
            />

            <MetricCard
              title="Size-Weighted Load"
              value={`${sizeWeightedLoad} pts`}
              description="Complexity sum (1/2/3)"
              color="grape"
              icon={<IconFlame size={18} />}
            />

            <MetricCard
              title="Overdue Tasks"
              value={overdueTasksCount}
              description="Action needed"
              color="red"
              icon={<IconClock size={18} />}
            />

            <MetricCard
              title="Accepted This Month"
              value={acceptedThisMonthCount}
              description={`${acceptedThisMonthPts} complexity pts`}
              color="teal"
              icon={<IconTrophy size={18} />}
            />
          </SimpleGrid>
        ) : undefined
      }
    >

      {/* =========================
          CONTENT VIEWS
      ========================= */}

      {activeProjectId && (
        <ProjectDetailsView
          projectId={activeProjectId}
          onBack={() => setActiveProjectId(null)}
        />
      )}

      {!activeProjectId && memberView === 'my-work' && (
        <Paper
          withBorder
          radius="md"
          p="md"
        >
          <Stack gap="md">
            <Group
              justify="space-between"
              align="flex-start"
            >
              <Stack gap={3}>
                <Group gap="xs">
                  <IconUser
                    size={20}
                    color="var(--mantine-color-blue-6)"
                  />
                  <Title order={5}>
                    My Active Work
                  </Title>
                </Group>
                <Text
                  size="xs"
                  c="dimmed"
                >
                  Your active tasks, deadlines, and
                  current execution status
                </Text>
              </Stack>
            </Group>

            <PersonalTasksTable personId={personId} onProjectClick={setActiveProjectId} />
          </Stack>
        </Paper>
      )}

      {!activeProjectId && memberView === 'team' && (
        <Paper
          withBorder
          radius="md"
          p="md"
        >
          <SharedProjectsTable personId={personId} onProjectClick={setActiveProjectId} />
        </Paper>
      )}

      {!activeProjectId && memberView === 'completed' && (
        <Paper
          withBorder
          radius="md"
          p="md"
        >
          <Stack gap="md">
            <Group
              justify="space-between"
              align="flex-start"
            >
              <Stack gap={3}>
                <Group gap="xs">
                  <IconTrophy
                    size={20}
                    color="var(--mantine-color-teal-6)"
                  />
                  <Title order={5}>
                    Accepted Deliverables
                  </Title>
                </Group>
                <Text
                  size="xs"
                  c="dimmed"
                >
                  Work that has been formally accepted by project leads
                </Text>
              </Stack>
            </Group>

            <AcceptedDeliverablesTable personId={personId} onProjectClick={setActiveProjectId} />
          </Stack>
        </Paper>
      )}

    </MemberTemplate>
  );
}