import {
  Button,
  Box,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useState } from 'react';

import {
  IconAlertCircle,
  IconCalendarEvent,
  IconPlayerPlay,
  IconSend,
} from '@tabler/icons-react';

import { BlockedBadge } from '../atoms/BlockedBadge';
import { ComplexityBadge } from '../atoms/ComplexityBadge';
import { OverdueBadge } from '../atoms/OverdueBadge';
import { StatusBadge } from '../atoms/StatusBadge';

import {
  ReusableTable,
  type TableColumn,
} from '../../../Table/ReusableTable';

import type { PersonalTask } from '../../../../types/memberpersonaltasks';
import { useSubmitTask, useTasks, useUpdateTaskStatus } from '../../../../api/hooks/use-tasks';
import { useProjects } from '../../../../api/hooks/use-projects';
import { useClearBlocker } from '../../../../api/hooks/use-blockers';
import { RaiseBlockerModal } from './RaiseBlockerModal';
import { RescheduleTaskModal } from './RescheduleTaskModal';
import { ClearBlockerModal } from './ClearBlockerModal';
import { TaskDiagnosticDrawer } from '../../../detail-views/TaskDiagnosticDrawer';

interface personTaskTableProps {
  personId:string;
}


export function PersonalTasksTable({personId}:personTaskTableProps) {
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);

  const clickableCell = (taskId: string | number, children: React.ReactNode) => (
    <Box
      onClick={() => setDrawerTaskId(String(taskId))}
      style={{ cursor: 'pointer', height: '100%', width: '100%', display: 'flex', alignItems: 'center' }}
    >
      {children}
    </Box>
  );

const personalTaskColumns: TableColumn<PersonalTask>[] = [
  {
    key: 'title',
    label: 'Task Title & Description',
    width: '40%',

    render: (task) => clickableCell(task.id, (
      <Stack gap={3}>
        <Text
          size="sm"
          fw={600}
          c="dark"
        >
          {task.title}
        </Text>

        <Text
          size="xs"
          c="dimmed"
          lineClamp={1}
        >
          {task.overview}
        </Text>
      </Stack>
    )),
  },

  {
    key: 'project',
    label: 'Project',
    width: '20%',
    render: (task) => (
      <Text
        size="sm"
        c="blue.7"
        fw={500}
      >
        {task.project}
      </Text>
    ),
  },

  {
    key: 'complexity',
    label: 'Complexity',
    width: '12%',

    render: (task) => clickableCell(task.id, (
      <ComplexityBadge
        value={task.complexity}
      />
    )),
  },

  {
    key: 'dueDate',
    label: 'Due Date',
    width: '12%',

    render: (task) => clickableCell(task.id, (
      <Stack gap={4}>
        <Text
          size="sm"
          c={task.overdue ? 'red' : 'dark'}
        >
          {task.dueDate}
        </Text>

        {task.overdue && (
          <OverdueBadge />
        )}
      </Stack>
    )),
  },

  {
    key: 'status',
    label: 'Status',
    width: '12%',

    render: (task) => clickableCell(task.id, (
      <Stack gap={4}>
        <StatusBadge
          status={task.status}
        />

        {task.status === 'BLOCKED' && (
          <BlockedBadge />
        )}
      </Stack>
    )),
  },

  {
    key: 'accessMode',
    label: 'Actions',
    width: '18%',

    render: (task) => (
      <Group gap={6}>

        {/* START WORKING */}
        {task.status === 'NOT STARTED' && (
          <Button
            size="compact-xs"
            variant="light"
            color="teal"
            leftSection={
              <IconPlayerPlay size={13} />
            }
            onClick={() => handleStart(task.id)}
          >
            Start Working
          </Button>
        )}

        {/* SUBMIT */}
        {task.status === 'IN PROGRESS' && (
          <Button
            size="compact-xs"
            variant="light"
            color="violet"
            leftSection={
              <IconSend size={13} />
            }
            onClick={() => handleSubmit(task.id)}
          >
            Submit
          </Button>
        )}

        {/* RAISE BLOCKER */}
        {task.status === 'IN PROGRESS' && (
          <Button
            size="compact-xs"
            variant="subtle"
            color="red"
            p={5}
            aria-label="Raise blocker"
            onClick={() => handleOpenRaiseBlocker(task)}
          >
            <IconAlertCircle size={15} />
          </Button>
        )}

        {/* RESUME */}
        {task.status === 'BLOCKED' && (
          <Button
            size="compact-xs"
            variant="light"
            color="blue"
            leftSection={
              <IconPlayerPlay size={13} />
            }
            onClick={() => handleResume(task.id as string)}
          >
            Resume
          </Button>
        )}

        {/* RESCHEDULE DUE DATE */}
        <Button
          size="compact-xs"
          variant="subtle"
          color="orange"
          p={5}
          aria-label="Reschedule due date"
          onClick={() => handleOpenReschedule(task)}
        >
          <IconCalendarEvent size={15} />
        </Button>

      </Group>
    ),
  },
];


const { mutate: updateTaskStatus } = useUpdateTaskStatus();
const { mutate: clearBlocker } = useClearBlocker();

const handleStart = (taskId: string) => {
    updateTaskStatus({
      taskId,
      status: 'in_progress',
      actorId: personId,
    });
    console.log(`Start working button clicked for task: ${taskId}`);

}

const handleResume = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.activeBlockerId) {
      clearBlocker({
        blockerId: task.activeBlockerId,
        actorId: personId,
      });
      console.log(`Blocker cleared and task resumed: ${taskId}`);
    } else {
      updateTaskStatus({
        taskId,
        status: 'in_progress',
        actorId: personId,
      });
      console.log(`Resume button clicked for task: ${taskId}`);
    }
}

const{ mutate: submitTask } = useSubmitTask();
const handleSubmit = (taskId: string) => {
  submitTask({
    taskId,
    actorId: personId,
    notes:'task completed successfully',
    deliverableUrl:''
  });

  console.log(`Submit button clicked for task: ${taskId}`);
}
  const {data: tasks = [], isLoading, error} = useTasks({
    assigneeId: personId,
  });

  const { data: projects = [] } = useProjects();

  const [raiseBlockerOpened, setRaiseBlockerOpened] = useState(false);
  const [selectedTaskForBlocker, setSelectedTaskForBlocker] = useState<{ id: string; title: string } | null>(null);

  const [rescheduleOpened, setRescheduleOpened] = useState(false);
  const [selectedTaskForReschedule, setSelectedTaskForReschedule] = useState<{ id: string; title: string; dueDate: string } | null>(null);

  const [clearBlockerOpened, setClearBlockerOpened] = useState(false);
  const [selectedTaskForClearBlocker, setSelectedTaskForClearBlocker] = useState<{ id: string; title: string; projectId: string; taskOwnerId: string; activeBlockerId?: string } | null>(null);

  const handleOpenRaiseBlocker = (task: any) => {
    setSelectedTaskForBlocker({ id: task.id as string, title: task.title });
    setRaiseBlockerOpened(true);
  };

  const handleCloseRaiseBlocker = () => {
    setSelectedTaskForBlocker(null);
    setRaiseBlockerOpened(false);
  };

  const handleOpenReschedule = (task: any) => {
    setSelectedTaskForReschedule({ id: task.id as string, title: task.title, dueDate: task.dueDate });
    setRescheduleOpened(true);
  };

  const handleCloseReschedule = () => {
    setSelectedTaskForReschedule(null);
    setRescheduleOpened(false);
  };

  const handleOpenClearBlocker = (task: any) => {
    setSelectedTaskForClearBlocker({
      id: task.id as string,
      title: task.title,
      projectId: task.projectId || '',
      taskOwnerId: task.assigneeId || '',
      activeBlockerId: task.activeBlockerId
    });
    setClearBlockerOpened(true);
  };

  const handleCloseClearBlocker = () => {
    setSelectedTaskForClearBlocker(null);
    setClearBlockerOpened(false);
  };

  if (isLoading) {
    return <Text>Loading tasks...</Text>;
  }

  if (error) {
    return (
      <Text c="red">
        Failed to load tasks.
      </Text>
    );
  }

  const mappedTasks: PersonalTask[] = tasks.map((task) => {
    const project = projects.find((p) => p.id === task.projectId);
    
    let complexity: PersonalTask['complexity'] = 'LOW (1 PT)';
    if (task.complexity === 'mid') complexity = 'MID (2 PTS)';
    if (task.complexity === 'high') complexity = 'HIGH (3 PTS)';

    let status: PersonalTask['status'] = 'NOT STARTED';
    if (task.status === 'in_progress') status = 'IN PROGRESS';
    if (task.status === 'blocked') status = 'BLOCKED';
    if (task.status === 'submitted') status = 'SUBMITTED (REVIEW)';
    if (task.status === 'accepted') status = 'ACCEPTED';

    let accessMode: PersonalTask['accessMode'] = 'INSPECT (READ-ONLY)';
    if (status === 'NOT STARTED') accessMode = 'START';
    if (status === 'IN PROGRESS') accessMode = 'SUBMIT';

    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'accepted' && task.status !== 'submitted';

    return {
      id: task.id as any, // ID is string in Task but PersonalTask type might expect number. Casting to any to satisfy the table since ReusableTable accepts both
      title: task.title,
      overview: task.description,
      project: project?.name || 'Unknown Project',
      projectId: task.projectId,
      complexity,
      dueDate: task.dueDate,
      overdue: isOverdue,
      status,
      accessMode,
    };
  });

  return (
    <>
      <ReusableTable
        columns={personalTaskColumns}
        data={mappedTasks}
      />
      {selectedTaskForBlocker && (
        <RaiseBlockerModal
          opened={raiseBlockerOpened}
          onClose={handleCloseRaiseBlocker}
          taskId={selectedTaskForBlocker.id}
          taskTitle={selectedTaskForBlocker.title}
          actorId={personId}
        />
      )}
      {selectedTaskForReschedule && (
        <RescheduleTaskModal
          opened={rescheduleOpened}
          onClose={handleCloseReschedule}
          taskId={selectedTaskForReschedule.id}
          taskTitle={selectedTaskForReschedule.title}
          actorId={personId}
          currentDueDate={selectedTaskForReschedule.dueDate}
        />
      )}
      {selectedTaskForClearBlocker && (
        <ClearBlockerModal
          opened={clearBlockerOpened}
          onClose={handleCloseClearBlocker}
          taskId={selectedTaskForClearBlocker.id}
          taskTitle={selectedTaskForClearBlocker.title}
          projectId={selectedTaskForClearBlocker.projectId}
          taskOwnerId={selectedTaskForClearBlocker.taskOwnerId}
          actorId={personId}
          activeBlockerId={selectedTaskForClearBlocker.activeBlockerId}
        />
      )}
      <TaskDiagnosticDrawer
        opened={!!drawerTaskId}
        onClose={() => setDrawerTaskId(null)}
        taskId={drawerTaskId}
        isReadOnly={false}
        onOpenRaiseBlocker={(task: any) => { setDrawerTaskId(null); handleOpenRaiseBlocker(task); }}
        onOpenReschedule={(task: any) => { setDrawerTaskId(null); handleOpenReschedule(task); }}
        onOpenClearBlocker={(task: any) => { setDrawerTaskId(null); handleOpenClearBlocker(task); }}
        onStartWorking={(task: any) => {
          updateTaskStatus({ taskId: task.id as string, status: 'in_progress', actorId: personId });
        }}
        onSubmitTask={(task: any) => {
          setDrawerTaskId(null);
          handleSubmit(task.id as string);
        }}
      />
    </>
  );
}
