import {
  Badge,
  Text,
} from '@mantine/core';

import { ComplexityBadge } from './TaskBadges';
import { ReusableTable, TableColumn } from '../../Table/ReusableTable';
import { AcceptedDeliverable } from '../../../types/accepteddeliverables';
import { useTasks } from '../../../api/hooks/use-tasks';
import { useProjects } from '../../../api/hooks/use-projects';

const deliverableColumns: TableColumn<AcceptedDeliverable>[] = [
  {
    key: 'deliverable',
    label: 'Deliverable',
    width: '35%',

    render: (item) => (
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

    render: (item) => (
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

    render: (item) => (
      <ComplexityBadge
        value={item.complexity}
      />
    ),
  },

  {
    key: 'acceptedOn',
    label: 'Accepted On',
    width: '12%',

    render: (item) => (
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

interface AcceptedDeliverablesTableProps {
  personId: string;
}

export function AcceptedDeliverablesTable({ personId }: AcceptedDeliverablesTableProps) {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    assigneeId: personId,
    status: ['accepted']
  });
  const { data: projects = [] } = useProjects();

  if (tasksLoading) {
    return <Text>Loading accepted deliverables...</Text>;
  }

  const mappedDeliverables: AcceptedDeliverable[] = tasks.map((task) => {
    const project = projects.find((p) => p.id === task.projectId);

    let complexity: AcceptedDeliverable['complexity'] = 'LOW (1 PT)';
    if (task.complexity === 'mid') complexity = 'MID (2 PTS)';
    if (task.complexity === 'high') complexity = 'HIGH (3 PTS)';

    const dateStr = task.acceptedAt ? new Date(task.acceptedAt).toLocaleDateString() : 'Unknown';

    return {
      id: task.id as any,
      deliverable: task.title,
      project: project?.name || 'Unknown Project',
      complexity,
      acceptedOn: dateStr,
    };
  });

  return (
    <ReusableTable
      columns={deliverableColumns}
      data={mappedDeliverables}
    />
  );
}