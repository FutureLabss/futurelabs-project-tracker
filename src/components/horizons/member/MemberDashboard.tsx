import { useState } from 'react';
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

import { MetricCard } from './atoms/MetricCard';
import { PersonalTasksTable } from './organisms/PersonalTasksTable';
import { SharedProjectsTable } from './organisms/SharedProjectsTable';
import { AcceptedDeliverablesTable } from './organisms/AcceptedDeliverablesTable';
import { CreateTaskModal } from './organisms/CreateTaskModal';
import {
  MemberTaskActionModal,
  type MemberTaskAction,
} from './organisms/MemberTaskActionModal';
import { MemberPageHeader } from './molecules/MemberPageHeader';
import { MemberTemplate } from './templates/MemberTemplate';
import { MemberView } from '../../../types/dashboard';
import { useTasks, useUpdateTaskStatus } from '../../../api/hooks/use-tasks';
import { useProjects } from '../../../api/hooks/use-projects';
import { usePersons } from '../../../api/hooks/use-availability';
import { TaskBoard } from '../../task-board';

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
  const { data: myTasks = [] } = useTasks({ assigneeId: personId });
  const { data: allTasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: persons = [] } = usePersons();

  const updateTaskStatusMutation = useUpdateTaskStatus();

  const [myWorkViewMode, setMyWorkViewMode] = useState<'board' | 'table'>('board');
  const [teamViewMode, setTeamViewMode] = useState<'board' | 'table'>('table');
  const [createTaskOpened, setCreateTaskOpened] = useState(false);
  const [memberAction, setMemberAction] = useState<MemberTaskAction | null>(null);

  const activeTasks = myTasks.filter(
    (t) => t.status !== 'accepted' && t.status !== 'cancelled',
  );
  const activeTasksCount = activeTasks.length;

  const getComplexityPoints = (complexity: string) => {
    const c = complexity.toLowerCase();
    if (c === 'high') return 3;
    if (c === 'mid') return 2;
    if (c === 'low') return 1;
    return 0;
  };

  const sizeWeightedLoad = activeTasks.reduce(
    (acc, t) => acc + getComplexityPoints(t.complexity),
    0,
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasksCount = activeTasks.filter((t) => t.dueDate < todayStr).length;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const acceptedThisMonthTasks = myTasks.filter(
    (t) => t.status === 'accepted' && t.acceptedAt?.startsWith(currentMonth),
  );
  const acceptedThisMonthCount = acceptedThisMonthTasks.length;
  const acceptedThisMonthPts = acceptedThisMonthTasks.reduce(
    (acc, t) => acc + getComplexityPoints(t.complexity),
    0,
  );

  return (
    <MemberTemplate
      header={
        <MemberPageHeader
          personName={personName}
          personId={personId}
          memberView={memberView}
        />
      }
      metricsGrid={
        memberView !== 'completed' ? (
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

      {memberView === 'my-work' && (
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

              <Group gap="xs" wrap="nowrap">
                <SegmentedControl
                  value={myWorkViewMode}
                  onChange={(val) => setMyWorkViewMode(val as 'board' | 'table')}
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
                onTaskStatusChange={async (taskId, targetStatus) => {
                  await updateTaskStatusMutation.mutateAsync({
                    taskId,
                    status: targetStatus,
                    actorId: personId,
                  });
                }}
                onTaskActionRequired={(req) => {
                  const targetTask = activeTasks.find((t) => t.id === req.taskId);
                  if (req.kind === 'blocker') {
                    setMemberAction({
                      kind: 'blocker',
                      taskId: req.taskId,
                      taskTitle: targetTask?.title,
                    });
                  } else if (req.kind === 'clear' && req.blockerId) {
                    setMemberAction({
                      kind: 'clear',
                      taskId: req.taskId,
                      blockerId: req.blockerId,
                      taskTitle: targetTask?.title,
                    });
                  } else if (req.kind === 'submit') {
                    setMemberAction({
                      kind: 'submit',
                      taskId: req.taskId,
                      taskTitle: targetTask?.title,
                    });
                  }
                }}
                onCreateTask={() => setCreateTaskOpened(true)}
                storageKey="futurelabs_member_taskboard_cols_v1"
              />
            ) : (
              <PersonalTasksTable personId={personId} />
            )}
          </Stack>
        </Paper>
      )}

      {memberView === 'team' && (
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
                onChange={(val) => setTeamViewMode(val as 'board' | 'table')}
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
                onTaskStatusChange={async (taskId, targetStatus) => {
                  await updateTaskStatusMutation.mutateAsync({
                    taskId,
                    status: targetStatus,
                    actorId: personId,
                  });
                }}
                onTaskActionRequired={(req) => {
                  const targetTask = allTasks.find((t) => t.id === req.taskId);
                  if (req.kind === 'blocker') {
                    setMemberAction({
                      kind: 'blocker',
                      taskId: req.taskId,
                      taskTitle: targetTask?.title,
                    });
                  } else if (req.kind === 'clear' && req.blockerId) {
                    setMemberAction({
                      kind: 'clear',
                      taskId: req.taskId,
                      blockerId: req.blockerId,
                      taskTitle: targetTask?.title,
                    });
                  } else if (req.kind === 'submit') {
                    setMemberAction({
                      kind: 'submit',
                      taskId: req.taskId,
                      taskTitle: targetTask?.title,
                    });
                  }
                }}
                storageKey="futurelabs_team_taskboard_cols_v1"
              />
            ) : (
              <SharedProjectsTable personId={personId} />
            )}
          </Stack>
        </Paper>
      )}

      {memberView === 'completed' && (
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

            <AcceptedDeliverablesTable personId={personId} />
          </Stack>
        </Paper>
      )}

      {/* Member modals */}
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