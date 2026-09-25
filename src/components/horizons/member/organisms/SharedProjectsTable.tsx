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

import { BlockedBadge } from '../atoms/BlockedBadge';
import { ComplexityBadge } from '../atoms/ComplexityBadge';
import { OverdueBadge } from '../atoms/OverdueBadge';
import { StatusBadge } from '../atoms/StatusBadge';
import { SharedProjectTask } from '../../../../types/memberSharedProject';
import { ReusableTable, TableColumn } from '../../../Table/ReusableTable';
import { useTasks } from '../../../../api/hooks/use-tasks';
import { useProjects } from '../../../../api/hooks/use-projects';
import { usePersons } from '../../../../api/hooks/use-availability';

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
          status={task.status as any}
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

interface SharedProjectsTableProps {
  personId: string;
}

export function SharedProjectsTable({ personId }: SharedProjectsTableProps) {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: persons = [] } = usePersons();

  if (tasksLoading) {
    return <Text>Loading shared projects...</Text>;
  }

  const mappedTasks: SharedProjectTask[] = tasks
    .filter((task) => task.assigneeId !== personId && task.status !== 'accepted' && task.status !== 'cancelled')
    .map((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      const assignee = persons.find((p) => p.id === task.assigneeId);
      
      let complexity: SharedProjectTask['complexity'] = 'LOW (1 PT)';
      if (task.complexity === 'mid') complexity = 'MID (2 PTS)';
      if (task.complexity === 'high') complexity = 'HIGH (3 PTS)';

      let status: SharedProjectTask['status'] = 'NOT STARTED';
      if (task.status === 'in_progress') status = 'IN PROGRESS';
      if (task.status === 'blocked') status = 'BLOCKED';

      const isOverdue = new Date(task.dueDate) < new Date();

      return {
        id: task.id as any,
        title: task.title,
        overview: task.description,
        teammate: assignee ? {
          name: assignee.name,
          initials: assignee.name.substring(0, 2).toUpperCase(),
        } : undefined,
        project: project?.name || 'Unknown Project',
        complexity,
        dueDate: task.dueDate,
        overdue: isOverdue,
        status,
        accessMode: 'INSPECT (READ-ONLY)',
      };
    });

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
              Teammates' Tasks & Shared Work ({mappedTasks.length})
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
        data={mappedTasks}
      />

    </Stack>
  );
}