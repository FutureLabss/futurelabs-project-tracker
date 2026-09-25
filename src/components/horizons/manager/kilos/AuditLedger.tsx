import { Paper, Group, Text, Badge } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { ReusableTable, type ColumnDef } from '../../../Table/ReusableTab';
import dayjs from "dayjs";

export interface LedgerDisplayRow {
  id: string;
  occurredAt: string;
  actorName: string;
  eventType: string;
  transition: string;
  justification: string;
}

interface AuditLedgerProps {
  ledgerRows: LedgerDisplayRow[];
  loading?: boolean;
}

export function AuditLedger({ ledgerRows, loading }: AuditLedgerProps) {
  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "task_created":
      case "task created":
        return "cyan";
      case "submitted_to_gate":
      case "submitted to gate":
      case "task_submitted":
        return "grape";
      case "deliverable_accepted":
      case "deliverable accepted":
      case "task_accepted":
        return "teal";
      case "status_changed":
      case "status changed":
        return "blue";
      default:
        return "gray";
    }
  };

  const columns: ColumnDef<LedgerDisplayRow>[] = [
    {
      header: "Timestamp",
      render: (r) => (
        <Text size="xs" c="dimmed">
          {dayjs(r.occurredAt).isValid()
            ? dayjs(r.occurredAt).format("hh:mm:ss A")
            : r.occurredAt}
        </Text>
      ),
    },
    {
      header: "Actor",
      render: (r) => (
        <Text size="xs" fw={700} c="blue.7">
          {r.actorName}
        </Text>
      ),
    },
    {
      header: "Event Type",
      render: (r) => (
        <Badge variant="light" color={getBadgeColor(r.eventType)} size="xs">
          {r.eventType.replace(/_/g, " ").toUpperCase()}
        </Badge>
      ),
    },
    {
      header: "Transition",
      render: (r) => (
        <Text size="xs" fw={600} c="dark.7">
          {r.transition}
        </Text>
      ),
    },
    {
      header: "Mandatory Justification / Note",
      render: (r) => (
        <Text size="xs" c="dimmed">
          {r.justification}
        </Text>
      ),
    },
  ];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconHistory size={20} color="#20c997" />
          <Text size="md" fw={700} c="dark.9">
            Immutable Project Audit Ledger
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          Append-only event stream • Click any row to inspect raw record
        </Text>
      </Group>

      <ReusableTable columns={columns} data={ledgerRows} loading={loading} />
    </Paper>
  );
}