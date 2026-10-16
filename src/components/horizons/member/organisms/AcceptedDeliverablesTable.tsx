import {
  Badge,
  Text,
} from '@mantine/core';

import { ComplexityBadge } from '../atoms/ComplexityBadge';
import { ReusableTable, TableColumn } from '../../../Table/ReusableTable';
import { AcceptedDeliverable } from '../../../../types/accepteddeliverables';
import { useTasks } from '../../../../api/hooks/use-tasks';
import { useProjects } from '../../../../api/hooks/use-projects';

interface AcceptedDeliverablesTableProps {
  personId: string;
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

export function AcceptedDeliverablesTable({ personId, onProjectClick }: AcceptedDeliverablesTableProps) {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    assigneeId: personId,
    status: ['accepted']
  });
  const { data: projects = [] } = useProjects();

  if (tasksLoading) {
    return <Text>Loading accepted deliverables...</Text>;
  }

  const mappedDeliverables: AcceptedDeliverable[] = tasks.map((task: any) => {
    const project = projects.find((p: any) => p.id === task.projectId);

    let complexity: AcceptedDeliverable['complexity'] = 'LOW (1 PT)';
    if (task.complexity === 'mid') complexity = 'MID (2 PTS)';
    if (task.complexity === 'high') complexity = 'HIGH (3 PTS)';

    const dateStr = task.acceptedAt ? new Date(task.acceptedAt).toLocaleDateString() : 'Unknown';

    return {
      id: task.id as any,
      deliverable: task.title,
      project: project?.name || 'Unknown Project',
      projectId: task.projectId,
      complexity,
      acceptedOn: dateStr,
    };
  });

  return (
    <ReusableTable
      columns={deliverableColumns(onProjectClick)}
      data={mappedDeliverables}
    />
  );
}