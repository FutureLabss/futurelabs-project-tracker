import { useState } from "react";
import { Paper, Group, Text, Badge, Select } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { ReusableTable, type ColumnDef } from '../../../Table/ReusableTab';
import dayjs from "dayjs";

export interface LedgerDisplayRow {
  id: string;
  occurredAt: string;
  actorId: string;
  projectId: string | null;
  actorName: string;
  eventType: string;
  transition: string;
  justification: string;
}

interface AuditLedgerProps {
  ledgerRows: LedgerDisplayRow[];
  loading?: boolean;
  projects: { id: string; name: string }[];
  people: { id: string; name: string }[];
}

const readableType = (type: string) => type.replace(/_/g, " ");

/** FR-48 / FR-49: changes in the manager's projects, newest first, filterable. */
export function AuditLedger({ ledgerRows, loading, projects, people }: AuditLedgerProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [actorId, setActorId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string | null>(null);

  const actorIds = new Set(ledgerRows.map((r) => r.actorId));
  const eventTypes = [...new Set(ledgerRows.map((r) => r.eventType))].sort();
  const visibleRows = ledgerRows
    .filter((r) => !projectId || r.projectId === projectId)
    .filter((r) => !actorId || r.actorId === actorId)
    .filter((r) => !eventType || r.eventType === eventType)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

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
            ? dayjs(r.occurredAt).format("YYYY-MM-DD hh:mm A")
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
        <Group gap="xs">
          <Select
            size="xs"
            placeholder="All projects"
            clearable
            data={projects.map((p) => ({ value: p.id, label: p.name }))}
            value={projectId}
            onChange={setProjectId}
          />
          <Select
            size="xs"
            placeholder="All people"
            clearable
            searchable
            data={people.filter((p) => actorIds.has(p.id)).map((p) => ({ value: p.id, label: p.name }))}
            value={actorId}
            onChange={setActorId}
          />
          <Select
            size="xs"
            placeholder="All change types"
            clearable
            data={eventTypes.map((t) => ({ value: t, label: readableType(t) }))}
            value={eventType}
            onChange={setEventType}
          />
        </Group>
      </Group>

      <ReusableTable
        columns={columns}
        data={visibleRows}
        loading={loading}
        emptyLabel="No changes match these filters."
      />
    </Paper>
  );
}