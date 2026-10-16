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
  IconSend,
  IconTable,
  IconTrophy,
  IconUser,
} from '@tabler/icons-react';

import { usePersons } from '../../../api/hooks/use-availability';
import { useMemberTaskFlags } from '../../../api/hooks/use-member-task-flags';
import { useProjects } from '../../../api/hooks/use-projects';
import { useTasks, useUpdateTaskStatus } from '../../../api/hooks/use-tasks';
import { SYSTEM_CONFIG } from '../../../domain/config/system-thresholds';
import type { MemberView } from '../../../types/dashboard';
import { TaskDiagnosticDrawer } from '../../detail-views/TaskDiagnosticDrawer';
import { TaskBoard } from '../../task-board';
import { MetricCard } from './atoms/MetricCard';
import { MemberPageHeader } from './molecules/MemberPageHeader';
import { AcceptedDeliverablesTable } from './organisms/AcceptedDeliverablesTable';
import { CreateTaskModal } from './organisms/CreateTaskModal';
import {
  MemberTaskActionModal,
  type MemberTaskAction,
} from './organisms/MemberTaskActionModal';
import { MyWorkAttention } from './organisms/MyWorkAttention';
import { LinkedWorkPanel } from './organisms/LinkedWorkPanel';
import { PersonalTasksTable } from './organisms/PersonalTasksTable';
import { RescheduleTaskModal } from './organisms/RescheduleTaskModal';
import { SubmittedWorkTable } from './organisms/SubmittedWorkTable';
import { ProjectDetailsView } from './ProjectDetailsView';
import { MemberTemplate } from './templates/MemberTemplate';

interface MemberDashboardProps {
  personId: string;
  personName?: string;
  memberView: MemberView;
  date: string;
}

export default function MemberDashboard({
  personId,
  personName,
  memberView,
  date,
}: MemberDashboardProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [myWorkViewMode, setMyWorkViewMode] = useState<'board' | 'table'>('board');
  const [createTaskOpened, setCreateTaskOpened] = useState(false);
  const [memberAction, setMemberAction] = useState<MemberTaskAction | null>(null);
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    id: string;
    title: string;
    dueDate: string;
  } | null>(null);

  // Members only ever load their own tasks (FR-19).
  const { data: myTasks = [] } = useTasks({ assigneeId: personId });
  const { data: projects = [] } = useProjects();
  const { data: persons = [] } = usePersons();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const getFlags = useMemberTaskFlags(personId, date);

  useEffect(() => {
    setActiveProjectId(null);
    setDrawerTaskId(null);
  }, [memberView]);

  // FR-01 / FR-02: open work only, earliest due date first.
  const activeTasks = myTasks
    .filter((task) => task.status !== 'accepted' && task.status !== 'cancelled')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const weightOf = (task: (typeof myTasks)[number]) =>
    SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[task.complexity] ?? 0;

  const sizeWeightedLoad = activeTasks.reduce((total, task) => total + weightOf(task), 0);
  const overdueTasksCount = activeTasks.filter((task) => getFlags(task).overdue).length;
  const awaitingReviewCount = activeTasks.filter((task) => task.status === 'submitted').length;
  const currentMonth = date.slice(0, 7);
  const acceptedThisMonthTasks = myTasks.filter(
    (task) => task.status === 'accepted' && task.acceptedAt?.startsWith(currentMonth),
  );
  const acceptedThisMonthPoints = acceptedThisMonthTasks.reduce(
    (total, task) => total + weightOf(task),
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

  const isDrawerReadOnly = !myTasks.some((task) => task.id === drawerTaskId);

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
        !activeProjectId && memberView === 'my-work' ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <MetricCard
              title="Open Tasks"
              value={activeTasks.length}
              description={`${awaitingReviewCount} awaiting review`}
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
          personId={personId}
          onBack={() => setActiveProjectId(null)}
        />
      )}

      {!activeProjectId && memberView === 'my-work' && (
        <Stack gap="md">
          <MyWorkAttention
            tasks={activeTasks}
            getFlags={getFlags}
            onTaskClick={setDrawerTaskId}
          />

          <LinkedWorkPanel personId={personId} date={date} onTaskClick={setDrawerTaskId} />

          <Paper withBorder radius="md" p="md">
            <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Stack gap={3}>
                  <Group gap="xs">
                    <IconUser size={20} color="var(--mantine-color-blue-6)" />
                    <Title order={5}>My Work</Title>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Every open task assigned to you, earliest due date first
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
                  onTaskClick={setDrawerTaskId}
                  today={date}
                  onCreateTask={() => setCreateTaskOpened(true)}
                  storageKey="futurelabs_member_taskboard_cols_v1"
                />
              ) : (
                <PersonalTasksTable
                  personId={personId}
                  date={date}
                  getFlags={getFlags}
                  onProjectClick={setActiveProjectId}
                  onSubmitTask={(task) =>
                    setMemberAction({ kind: 'submit', taskId: task.id, taskTitle: task.title })
                  }
                />
              )}
            </Stack>
          </Paper>
        </Stack>
      )}

      {!activeProjectId && memberView === 'submitted' && (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Stack gap={3}>
              <Group gap="xs">
                <IconSend size={20} color="var(--mantine-color-violet-6)" />
                <Title order={5}>Submitted Work</Title>
              </Group>
              <Text size="xs" c="dimmed">
                Whether each submission was accepted, returned, or is still awaiting a decision
              </Text>
            </Stack>

            <SubmittedWorkTable personId={personId} date={date} onTaskClick={setDrawerTaskId} />
          </Stack>
        </Paper>
      )}

      {!activeProjectId && memberView === 'history' && (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Stack gap={3}>
              <Group gap="xs">
                <IconTrophy size={20} color="var(--mantine-color-teal-6)" />
                <Title order={5}>Accepted Work</Title>
              </Group>
              <Text size="xs" c="dimmed">
                Work that has been formally accepted, for the period you choose
              </Text>
            </Stack>

            <AcceptedDeliverablesTable
              personId={personId}
              date={date}
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
      <TaskDiagnosticDrawer
        date={date}
        opened={!!drawerTaskId}
        onClose={() => setDrawerTaskId(null)}
        taskId={drawerTaskId}
        isReadOnly={isDrawerReadOnly}
        onStartWorking={(task) => {
          updateTaskStatusMutation.mutate({
            taskId: task.id,
            status: 'in_progress',
            actorId: personId,
          });
        }}
        onSubmitTask={(task) => {
          setDrawerTaskId(null);
          setMemberAction({ kind: 'submit', taskId: task.id, taskTitle: task.title });
        }}
        onOpenRaiseBlocker={(task) => {
          setDrawerTaskId(null);
          setMemberAction({ kind: 'blocker', taskId: task.id, taskTitle: task.title });
        }}
        onOpenClearBlocker={(task) => {
          if (!task.activeBlockerId) return;
          setDrawerTaskId(null);
          setMemberAction({
            kind: 'clear',
            taskId: task.id,
            blockerId: task.activeBlockerId,
            taskTitle: task.title,
          });
        }}
        onOpenReschedule={(task) => {
          setDrawerTaskId(null);
          setRescheduleTarget({ id: task.id, title: task.title, dueDate: task.dueDate });
        }}
      />
      {rescheduleTarget && (
        <RescheduleTaskModal
          opened
          onClose={() => setRescheduleTarget(null)}
          taskId={rescheduleTarget.id}
          taskTitle={rescheduleTarget.title}
          actorId={personId}
          currentDueDate={rescheduleTarget.dueDate}
        />
      )}
    </MemberTemplate>
  );
}
