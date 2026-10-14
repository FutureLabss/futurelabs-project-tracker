import { useEffect, useState } from 'react';
import {
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconClipboardList,
  IconClock,
  IconFlame,
  IconLayoutKanban,
  IconPlus,
  IconTable,
  IconTrophy,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';

import { usePersons } from '../../../api/hooks/use-availability';
import { useProjects } from '../../../api/hooks/use-projects';
import { useTasks, useUpdateTaskStatus } from '../../../api/hooks/use-tasks';
import type { MemberView } from '../../../types/dashboard';
import { TaskBoard } from '../../task-board';
import { MetricCard } from './atoms/MetricCard';
import { MemberPageHeader } from './molecules/MemberPageHeader';
import { AcceptedDeliverablesTable } from './organisms/AcceptedDeliverablesTable';
import { CreateTaskModal } from './organisms/CreateTaskModal';
import {
  MemberTaskActionModal,
  type MemberTaskAction,
} from './organisms/MemberTaskActionModal';
import { PersonalTasksTable } from './organisms/PersonalTasksTable';
import { SharedProjectsTable } from './organisms/SharedProjectsTable';
import { ProjectDetailsView } from './ProjectDetailsView';
import { MemberTemplate } from './templates/MemberTemplate';

interface MemberDashboardProps {
  personId: string;
  personName?: string;
  memberView: MemberView;
}

export default function MemberDashboard({
  personId,
  personName,
  memberView,
}: MemberDashboardProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [myWorkViewMode, setMyWorkViewMode] = useState<'board' | 'table'>('board');
  const [teamViewMode, setTeamViewMode] = useState<'board' | 'table'>('table');
  const [createTaskOpened, setCreateTaskOpened] = useState(false);
  const [memberAction, setMemberAction] = useState<MemberTaskAction | null>(null);

  const { data: myTasks = [] } = useTasks({ assigneeId: personId });
  const { data: allTasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: persons = [] } = usePersons();
  const updateTaskStatusMutation = useUpdateTaskStatus();

  useEffect(() => {
    setActiveProjectId(null);
  }, [memberView]);

  const activeTasks = myTasks.filter(
    (task) => task.status !== 'accepted' && task.status !== 'cancelled',
  );

  const getComplexityPoints = (complexity: string) => {
    const normalizedComplexity = complexity.toLowerCase();
    if (normalizedComplexity === 'high') return 3;
    if (normalizedComplexity === 'mid') return 2;
    if (normalizedComplexity === 'low') return 1;
    return 0;
  };

  const sizeWeightedLoad = activeTasks.reduce(
    (total, task) => total + getComplexityPoints(task.complexity),
    0,
  );
  const today = new Date().toISOString().split('T')[0];
  const overdueTasksCount = activeTasks.filter((task) => task.dueDate < today).length;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const acceptedThisMonthTasks = myTasks.filter(
    (task) => task.status === 'accepted' && task.acceptedAt?.startsWith(currentMonth),
  );
  const acceptedThisMonthPoints = acceptedThisMonthTasks.reduce(
    (total, task) => total + getComplexityPoints(task.complexity),
    0,
  );

  const openTaskAction = (
    request: Parameters<
      NonNullable<React.ComponentProps<typeof TaskBoard>['onTaskActionRequired']>
    >[0],
    taskTitle?: string,
  ) => {
    if (request.kind === 'blocker') {
      setMemberAction({ kind: 'blocker', taskId: request.taskId, taskTitle });
    } else if (request.kind === 'clear' && request.blockerId) {
      setMemberAction({
        kind: 'clear',
        taskId: request.taskId,
        blockerId: request.blockerId,
        taskTitle,
      });
    } else if (request.kind === 'submit') {
      setMemberAction({ kind: 'submit', taskId: request.taskId, taskTitle });
    }
  };

  return (
    <MemberTemplate
      header={
        !activeProjectId ? (
          <MemberPageHeader
            personName={personName}
            personId={personId}
            memberView={memberView}
          />
        ) : undefined
      }
      metricsGrid={
        !activeProjectId && memberView !== 'completed' ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <MetricCard
              title="Active Tasks"
              value={activeTasks.length}
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
              value={acceptedThisMonthTasks.length}
              description={`${acceptedThisMonthPoints} complexity pts`}
              color="teal"
              icon={<IconTrophy size={18} />}
            />
          </SimpleGrid>
        ) : undefined
      }
    >
      {activeProjectId && (
        <ProjectDetailsView
          projectId={activeProjectId}
          onBack={() => setActiveProjectId(null)}
        />
      )}

      {!activeProjectId && memberView === 'my-work' && (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Stack gap={3}>
                <Group gap="xs">
                  <IconUser size={20} color="var(--mantine-color-blue-6)" />
                  <Title order={5}>My Active Work</Title>
                </Group>
                <Text size="xs" c="dimmed">
                  Your active tasks, deadlines, and current execution status
                </Text>
              </Stack>

              <Group gap="xs" wrap="wrap">
                <SegmentedControl
                  value={myWorkViewMode}
                  onChange={(value) => setMyWorkViewMode(value as 'board' | 'table')}
                  data={[
                    {
                      value: 'board',
                      label: (
                        <Group gap={6} wrap="nowrap">
                          <IconLayoutKanban size={15} />
                          <span>Board</span>
                        </Group>
                      ),
                    },
                    {
                      value: 'table',
                      label: (
                        <Group gap={6} wrap="nowrap">
                          <IconTable size={15} />
                          <span>Table</span>
                        </Group>
                      ),
                    },
                  ]}
                />
                <Button
                  leftSection={<IconPlus size={15} />}
                  onClick={() => setCreateTaskOpened(true)}
                  size="sm"
                >
                  Create Task
                </Button>
              </Group>
            </Group>

            {myWorkViewMode === 'board' ? (
              <TaskBoard
                tasks={activeTasks}
                projects={projects}
                people={persons}
                onTaskStatusChange={async (taskId, status) => {
                  await updateTaskStatusMutation.mutateAsync({
                    taskId,
                    status,
                    actorId: personId,
                  });
                }}
                onTaskActionRequired={(request) => {
                  const task = activeTasks.find((item) => item.id === request.taskId);
                  openTaskAction(request, task?.title);
                }}
                onCreateTask={() => setCreateTaskOpened(true)}
                storageKey="futurelabs_member_taskboard_cols_v1"
              />
            ) : (
              <PersonalTasksTable personId={personId} onProjectClick={setActiveProjectId} />
            )}
          </Stack>
        </Paper>
      )}

      {!activeProjectId && memberView === 'team' && (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Stack gap={3}>
                <Group gap="xs">
                  <IconUsers size={20} color="var(--mantine-color-indigo-6)" />
                  <Title order={5}>Teammates & Shared Work</Title>
                </Group>
                <Text size="xs" c="dimmed">
                  Collaborate and view peers’ task execution across shared projects
                </Text>
              </Stack>

              <SegmentedControl
                value={teamViewMode}
                onChange={(value) => setTeamViewMode(value as 'board' | 'table')}
                data={[
                  {
                    value: 'board',
                    label: (
                      <Group gap={6} wrap="nowrap">
                        <IconLayoutKanban size={15} />
                        <span>Board</span>
                      </Group>
                    ),
                  },
                  {
                    value: 'table',
                    label: (
                      <Group gap={6} wrap="nowrap">
                        <IconTable size={15} />
                        <span>Table</span>
                      </Group>
                    ),
                  },
                ]}
              />
            </Group>

            {teamViewMode === 'board' ? (
              <TaskBoard
                tasks={allTasks}
                projects={projects}
                people={persons}
                readOnly={false}
                canDragTask={(task) => task.assigneeId === personId}
                onTaskStatusChange={async (taskId, status) => {
                  await updateTaskStatusMutation.mutateAsync({
                    taskId,
                    status,
                    actorId: personId,
                  });
                }}
                onTaskActionRequired={(request) => {
                  const task = allTasks.find((item) => item.id === request.taskId);
                  openTaskAction(request, task?.title);
                }}
                storageKey="futurelabs_team_taskboard_cols_v1"
              />
            ) : (
              <SharedProjectsTable personId={personId} onProjectClick={setActiveProjectId} />
            )}
          </Stack>
        </Paper>
      )}

      {!activeProjectId && memberView === 'completed' && (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={3}>
                <Group gap="xs">
                  <IconTrophy size={20} color="var(--mantine-color-teal-6)" />
                  <Title order={5}>Accepted Deliverables</Title>
                </Group>
                <Text size="xs" c="dimmed">
                  Work that has been formally accepted by project leads
                </Text>
              </Stack>
            </Group>

            <AcceptedDeliverablesTable
              personId={personId}
              onProjectClick={setActiveProjectId}
            />
          </Stack>
        </Paper>
      )}

      <CreateTaskModal
        opened={createTaskOpened}
        onClose={() => setCreateTaskOpened(false)}
        personId={personId}
      />
      <MemberTaskActionModal
        action={memberAction}
        actorId={personId}
        onClose={() => setMemberAction(null)}
      />
    </MemberTemplate>
  );
}
