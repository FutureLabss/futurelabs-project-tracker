import {
  Badge,
  Text,
} from '@mantine/core';

import { ComplexityBadge } from './TaskBadges';
import { ReusableTable, TableColumn } from '../../Table/ReusableTable';
import { AcceptedDeliverable } from '../../../types/accepteddeliverables';
import { acceptedDeliverables } from './MockData';

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

export function AcceptedDeliverablesTable() {
  return (
    <ReusableTable
      columns={deliverableColumns}
      data={acceptedDeliverables}
    />
  );
}