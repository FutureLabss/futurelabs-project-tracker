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

import { StatCard } from './StatCard';
import { PersonalTasksTable } from './PersonalTasksTable';
import { SharedProjectsTable } from './SharedProjectsTable';
import { AcceptedDeliverablesTable } from './AcceptedDeliverablesTable';
import MemberHeader from './MemberHeader';
import { MemberView } from '../../../types/dashboard';
import { useTasks } from '../../../api/hooks/use-tasks';


interface MemberDashboardProps {
  personId:string;
  personName?:string;
  memberView: MemberView;
}

export default function MemberDashboard({personId, personName, memberView}:MemberDashboardProps) {

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
  const acceptedThisMonthPts = acceptedThisMonthTasks.reduce((acc, t) => acc + getComplexityPoints(t.complexity), 0);  return (
    <Stack
      gap="md"
      p="lg"
      style={{
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
      }}
    >

      {/* =========================
          HEADER
      ========================= */}

      <MemberHeader personName={personName} personId={personId} memberView={memberView} />


      {/* =========================
          STAT CARDS
      ========================= */}

      {memberView !== 'completed' && (
        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
            lg: 4,
          }}
        >
          <StatCard
            title="Active Tasks"
            value={activeTasksCount}
            description="In queue"
            color="blue"
            icon={
              <IconClipboardList size={18} />
            }
          />

          <StatCard
            title="Size-Weighted Load"
            value={`${sizeWeightedLoad} pts`}
            description="Complexity sum (1/2/3)"
            color="grape"
            icon={
              <IconFlame size={18} />
            }
          />

          <StatCard
            title="Overdue Tasks"
            value={overdueTasksCount}
            description="Action needed"
            color="red"
            icon={
              <IconClock size={18} />
            }
          />

          <StatCard
            title="Accepted This Month"
            value={acceptedThisMonthCount}
            description={`${acceptedThisMonthPts} complexity pts`}
            color="teal"
            icon={
              <IconTrophy size={18} />
            }
          />
        </SimpleGrid>
      )}


      {/* =========================
          CONTENT VIEWS
      ========================= */}

      {memberView === 'my-work' && (
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

            <PersonalTasksTable personId={personId} />

          </Stack>

        </Paper>
      )}

      {memberView === 'team' && (
        <Paper
          withBorder
          radius="md"
          p="md"
        >
          <SharedProjectsTable personId={personId} />
        </Paper>
      )}

      {memberView === 'completed' && (
        <Paper
          withBorder
          radius="md"
          p="md"
        >
          <Stack gap="md">

            <Group
              justify="space-between"
              align="center"
            >
              <Title order={5}>
                Accepted Deliverables Track Record (3)
              </Title>

              <Text
                size="xs"
                c="dimmed"
              >
                Verified accomplishments • Click any row
              </Text>
            </Group>

            <AcceptedDeliverablesTable personId={personId} />

          </Stack>
        </Paper>
      )}

    </Stack>
  );
}