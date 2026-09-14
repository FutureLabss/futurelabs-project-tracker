import {
  Button,
  Group,
  Stack,
  Text,
} from '@mantine/core';

import {
  IconAlertCircle,
  IconCalendarEvent,
  IconPlayerPlay,
  IconSend,
} from '@tabler/icons-react';

import {
  BlockedBadge,
  ComplexityBadge,
  OverdueBadge,
  StatusBadge,
} from './TaskBadges';

import {
  ReusableTable,
  type TableColumn,
} from '../../Table/ReusableTable';

import type { PersonalTask } from '../../../types/memberpersonaltasks';
import { personalTasks } from './MockData';


const personalTaskColumns: TableColumn<PersonalTask>[] = [
  {
    key: 'title',
    label: 'Task Title & Description',
    width: '40%',

    render: (task) => (
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
    ),
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

    render: (task) => (
      <ComplexityBadge
        value={task.complexity}
      />
    ),
  },

  {
    key: 'dueDate',
    label: 'Due Date',
    width: '12%',

    render: (task) => (
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
    ),
  },

  {
    key: 'status',
    label: 'Status',
    width: '12%',

    render: (task) => (
      <Stack gap={4}>
        <StatusBadge
          status={task.status}
        />

        {task.status === 'BLOCKED' && (
          <BlockedBadge />
        )}
      </Stack>
    ),
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
          >
            <IconAlertCircle size={15} />
          </Button>
        )}

        {/* RESCHEDULE DUE DATE */}
        <Button
          size="compact-xs"
          variant="subtle"
          color="orange"
          p={5}
          aria-label="Reschedule due date"
        >
          <IconCalendarEvent size={15} />
        </Button>

      </Group>
    ),
  },
];

export function PersonalTasksTable() {
  return (
    <ReusableTable
      columns={personalTaskColumns}
      data={personalTasks}
    />
  );
}