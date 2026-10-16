import { useState } from 'react';
import {
  Badge,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';

import { ComplexityBadge } from '../atoms/ComplexityBadge';
import { ReusableTable, TableColumn } from '../../../Table/ReusableTable';
import { AcceptedDeliverable } from '../../../../types/accepteddeliverables';
import { useTasks } from '../../../../api/hooks/use-tasks';
import { useProjects } from '../../../../api/hooks/use-projects';

interface AcceptedDeliverablesTableProps {
  personId: string;
  date: string;
  onProjectClick?: (projectId: string) => void;
}

const deliverableColumns = (onProjectClick?: (projectId: string) => void): TableColumn<AcceptedDeliverable>[] => [
  {
    key: 'deliverable',
    label: 'Deliverable',
    width: '35%',

    render: (item: AcceptedDeliverable) => (
      <Text
        size="sm"
        c="blue.7"
        fw={500}
      >
        {item.deliverable}
      </Text>
    ),
  },

  {
    key: 'project',
    label: 'Project',
    width: '30%',

    render: (item: AcceptedDeliverable) => onProjectClick ? (
      <Text
        size="sm"
        c="dimmed"
        style={{ cursor: 'pointer' }}
        onClick={() => item.projectId && onProjectClick(item.projectId)}
      >
        {item.project}
      </Text>
    ) : (
      <Text
        size="sm"
        c="dimmed"
      >
        {item.project}
      </Text>
    ),
  },

  {
    key: 'complexity',
    label: 'Complexity',
    width: '14%',

    render: (item: AcceptedDeliverable) => (
      <ComplexityBadge
        value={item.complexity}
      />
    ),
  },

  {
    key: 'acceptedOn',
    label: 'Accepted On',
    width: '12%',

    render: (item: AcceptedDeliverable) => (
      <Text
        size="sm"
        c="dimmed"
      >
        {item.acceptedOn}
      </Text>
    ),
  },

  {
    key: 'status',
    label: 'Status',
    width: '9%',

    render: () => (
      <Badge
        size="xs"
        color="teal"
        variant="filled"
      >
        ACCEPTED
      </Badge>
    ),
  },
];

export function AcceptedDeliverablesTable({ personId, date, onProjectClick }: AcceptedDeliverablesTableProps) {
  // FR-18: the member chooses the period; default to the current month.
  const [fromDate, setFromDate] = useState<Date | null>(() => dayjs(date).startOf('month').toDate());
  const [toDate, setToDate] = useState<Date | null>(() => dayjs(date).toDate());

  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    assigneeId: personId,
    status: ['accepted']
  });
  const { data: projects = [] } = useProjects();

  if (tasksLoading) {
    return <Text>Loading accepted deliverables...</Text>;
  }

  const from = fromDate ? dayjs(fromDate).format('YYYY-MM-DD') : null;
  const to = toDate ? dayjs(toDate).format('YYYY-MM-DD') : null;

  const mappedDeliverables: AcceptedDeliverable[] = tasks
    .filter((task) => {
      if (!task.acceptedAt) return false;
      const acceptedOn = dayjs(task.acceptedAt).format('YYYY-MM-DD');
      return (!from || acceptedOn >= from) && (!to || acceptedOn <= to);
    })
    .sort((a, b) => (b.acceptedAt ?? '').localeCompare(a.acceptedAt ?? ''))
    .map((task) => {
      const project = projects.find((p) => p.id === task.projectId);

      let complexity: AcceptedDeliverable['complexity'] = 'LOW (1 PT)';
      if (task.complexity === 'mid') complexity = 'MID (2 PTS)';
      if (task.complexity === 'high') complexity = 'HIGH (3 PTS)';

      return {
        id: task.id,
        deliverable: task.title,
        project: project?.name || 'Unknown Project',
        projectId: task.projectId,
        complexity,
        acceptedOn: dayjs(task.acceptedAt).format('YYYY-MM-DD'),
      };
    });

  return (
    <Stack gap="md">
      <Group gap="sm" align="flex-end" wrap="wrap">
        <DateInput
          label="Accepted from"
          valueFormat="YYYY-MM-DD"
          placeholder="Any time"
          clearable
          value={fromDate}
          onChange={setFromDate}
          maxDate={toDate ?? undefined}
        />
        <DateInput
          label="Accepted to"
          valueFormat="YYYY-MM-DD"
          placeholder="Any time"
          clearable
          value={toDate}
          onChange={setToDate}
          minDate={fromDate ?? undefined}
        />
        <Text size="sm" c="dimmed" pb={6}>
          {mappedDeliverables.length} accepted in this period
        </Text>
      </Group>
      <ReusableTable
        columns={deliverableColumns(onProjectClick)}
        data={mappedDeliverables}
        emptyMessage="No work accepted in this period."
      />
    </Stack>
  );
}