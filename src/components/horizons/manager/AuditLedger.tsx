import {
  Badge,
  Box,
  Card,
  Group,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { auditEvents, type AuditEvent } from '../../../data/mockData';
import { ReusableTable, type TableColumn } from '../../Table/ReusableTable';

type AuditLedgerProps = {
  events?: AuditEvent[];
  onSelectEvent?: (event: AuditEvent) => void;
};

const eventBadgeConfig: Record<string, { color: string; label: string }> = {
  'SUBMITTED TO GATE': { color: 'grape', label: 'SUBMITTED TO GATE' },
  'TASK CREATED': { color: 'blue', label: 'TASK CREATED' },
  'DELIVERABLE ACCEPTED': { color: 'teal', label: 'DELIVERABLE ACCEPTED' },
  'STATUS CHANGED': { color: 'cyan', label: 'STATUS CHANGED' },
};

export default function AuditLedger({
  events = auditEvents,
  onSelectEvent,
}: AuditLedgerProps) {
  const columns: TableColumn<AuditEvent>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      width: '12%',
      render: (event) => (
        <Text size="xs" c="dimmed">
          {event.timestamp}
        </Text>
      ),
    },
    {
      key: 'actor',
      label: 'Actor',
      width: '15%',
      render: (event) => (
        <Text
          size="sm"
          fw={600}
          c="blue.6"
          style={{ cursor: onSelectEvent ? 'pointer' : 'default' }}
          onClick={() => onSelectEvent?.(event)}
        >
          {event.actor}
        </Text>
      ),
    },
    {
      key: 'eventType',
      label: 'Event Type',
      width: '18%',
      render: (event) => {
        const config = eventBadgeConfig[event.eventType] || {
          color: 'gray',
          label: event.eventType,
        };
        return (
          <Badge color={config.color} variant="light" radius="sm" size="xs" fw={700}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'transition',
      label: 'Transition',
      width: '22%',
      render: (event) => (
        <Text size="sm" fw={700} c="dark.9">
          {event.transition}
        </Text>
      ),
    },
    {
      key: 'note',
      label: 'Mandatory Justification / Note',
      width: '33%',
      render: (event) => (
        <Text size="sm" c="dimmed">
          {event.note}
        </Text>
      ),
    },
  ];

  return (
    <Card withBorder radius="md" p="xl" bg="white">
      <Group justify="space-between" align="center" mb="md">
        <Group gap="sm">
          <ThemeIcon variant="transparent" c="teal.6" size="sm">
            <IconHistory size={24} />
          </ThemeIcon>
          <Title order={3} fz="lg" fw={700}>
            Immutable Project Audit Ledger
          </Title>
        </Group>

        <Text fz="xs" c="dimmed">
          Append-only event stream • Click any row to inspect raw record
        </Text>
      </Group>

      <Box mt="md">
        <ReusableTable
          columns={columns}
          data={events}
          emptyMessage="No audit records found"
        />
      </Box>
    </Card>
  );
}