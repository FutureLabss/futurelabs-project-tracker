import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';

import {
  IconEye,
  IconFilter,
  IconPlayerPlay,
  IconSend,
  IconUsers,
} from '@tabler/icons-react';



import {
  BlockedBadge,
  ComplexityBadge,
  OverdueBadge,
  StatusBadge,
} from './TaskBadges';
import { SharedProjectTask } from '../../../types/memberSharedProject';
import { ReusableTable, TableColumn } from '../../Table/ReusableTable';
import { sharedProjectTasks } from './MockData';





const sharedProjectColumns: TableColumn<SharedProjectTask>[] = [
  {
    key: 'title',
    label: 'Task Title & Overview',
    width: '31%',

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
    key: 'teammate',
    label: 'Assigned Teammate',
    width: '12%',

    render: (task) =>
      task.teammate ? (
        <Group
          gap="xs"
          wrap="nowrap"
        >
          <ActionIcon
            size={28}
            radius="xl"
            variant="light"
            color="cyan"
          >
            <Text
              size="xs"
              fw={600}
            >
              {task.teammate.initials}
            </Text>
          </ActionIcon>

          <Stack gap={0}>
            <Text
              size="sm"
              fw={500}
              c="blue.7"
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              {task.teammate.name}
            </Text>

            <Text
              size="xs"
              c="dimmed"
            >
              member
            </Text>
          </Stack>
        </Group>
      ) : (
        <Badge
          size="xs"
          color="gray"
          variant="light"
        >
          • UNASSIGNED
        </Badge>
      ),
  },

  {
    key: 'project',
    label: 'Project',
    width: '16%',

    render: (task) => (
      <Text
        size="sm"
        c="blue.7"
        fw={500}
        lineClamp={2}
      >
        {task.project}
      </Text>
    ),
  },

  {
    key: 'complexity',
    label: 'Complexity',
    width: '9%',

    render: (task) => (
      <ComplexityBadge
        value={task.complexity}
      />
    ),
  },

  {
    key: 'dueDate',
    label: 'Due Date',
    width: '10%',

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
    width: '10%',

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
    label: 'Access Mode',
    width: '12%',

    render: (task) => {
      const icon =
        task.accessMode === 'SUBMIT' ? (
          <IconSend size={13} />
        ) : task.accessMode === 'START' ? (
          <IconPlayerPlay size={13} />
        ) : (
          <IconEye size={13} />
        );

      return (
        <Button
          size="compact-xs"
          variant="light"
          color="blue"
          leftSection={icon}
        >
          {task.accessMode}
        </Button>
      );
    },
  },
];

export function SharedProjectsTable() {
  return (
    <Stack gap="md">

      <Group
        justify="space-between"
        align="flex-start"
      >
        <Stack gap={3}>

          <Group gap="xs">
            <IconUsers
              size={21}
              color="var(--mantine-color-blue-6)"
            />

            <Title order={5}>
              Teammates' Tasks & Shared Work (4)
            </Title>

            <Badge
              size="xs"
              color="blue"
              variant="light"
            >
              👁 READ-ONLY INSPECTION
            </Badge>
          </Group>

          <Text
            size="xs"
            c="dimmed"
          >
            Cross-team visibility for peer coordination,
            blocker awareness, and handoffs • Click any row
          </Text>

        </Stack>

        <Select
          w={220}
          size="sm"
          placeholder="All Shared Projects"
          leftSection={
            <IconFilter size={14} />
          }
          data={[
            {
              value: 'all',
              label: 'All Shared Projects',
            },
            {
              value: 'mobile',
              label: 'Mobile SDK Onboarding',
            },
            {
              value: 'data',
              label:
                'Data Ingestion & Analytics Pipeline',
            },
            {
              value: 'iam',
              label:
                'Identity & Access Engine (IAM v2)',
            },
          ]}
        />
      </Group>

      <ReusableTable
        columns={sharedProjectColumns}
        data={sharedProjectTasks}
      />

    </Stack>
  );
}