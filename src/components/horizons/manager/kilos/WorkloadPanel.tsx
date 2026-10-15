import { Group, Paper, Text } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import { ReusableTable, type ColumnDef } from "../../../Table/ReusableTab";
import type { PersonLoadRow } from "../../../../domain/calculations/manager-insights";

type Row = PersonLoadRow & { id: string };

/**
 * FR-40: open work per person in the manager's projects, weighted by complexity.
 * Listed alphabetically with no ranking, scores or colour-coding (NFR-02).
 */
export function WorkloadPanel({ rows }: { rows: PersonLoadRow[] }) {
  const columns: ColumnDef<Row>[] = [
    { header: "Person", render: (r) => <Text size="sm" fw={600}>{r.name}</Text> },
    { header: "Open tasks", render: (r) => <Text size="sm">{r.openTasks}</Text> },
    { header: "Open work (complexity points)", render: (r) => <Text size="sm">{r.openWeight} pts</Text> },
  ];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group gap="xs" mb="md">
        <IconUsers size={20} color="#20c997" />
        <Text size="md" fw={700}>Open Work by Person</Text>
        <Text size="xs" c="dimmed">Low = 1, Mid = 2, High = 3 points; accepted and cancelled work excluded</Text>
      </Group>
      <ReusableTable
        columns={columns}
        data={rows.map((r) => ({ ...r, id: r.personId ?? "unassigned" }))}
        emptyLabel="No open work in your projects."
      />
    </Paper>
  );
}
