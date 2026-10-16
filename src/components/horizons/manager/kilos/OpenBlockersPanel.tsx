import { useState } from "react";
import { Badge, Group, Paper, SegmentedControl, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconBarrierBlock } from "@tabler/icons-react";
import { ReusableTable, type ColumnDef } from "../../../Table/ReusableTab";
import type { Person } from "../../../../entities/person.entity";
import type { BlockerCategory } from "../../../../entities/blocker.entity";
import type { OpenBlockerRow } from "../../../../domain/calculations/manager-insights";
import { SYSTEM_CONFIG } from "../../../../domain/config/system-thresholds";

interface OpenBlockersPanelProps {
  rows: OpenBlockerRow[];
  people: Person[];
  onTaskClick: (taskId: string) => void;
}

type Row = OpenBlockerRow & { id: string };

/** FR-34 / FR-35 / FR-36: open blockers by age, optionally grouped by category. */
export function OpenBlockersPanel({ rows, people, onTaskClick }: OpenBlockersPanelProps) {
  const [grouping, setGrouping] = useState<"age" | "category">("age");
  const personName = (id: string) => people.find((p) => p.id === id)?.name ?? "Unknown person";

  const columns: ColumnDef<Row>[] = [
    {
      header: "Blocked task",
      render: (r) => (
        <UnstyledButton onClick={() => r.task && onTaskClick(r.task.id)}>
          <Stack gap={2}>
            <Text size="sm" fw={600}>{r.task?.title ?? "Unknown task"}</Text>
            <Text size="xs" c="dimmed" lineClamp={1}>{r.blocker.description}</Text>
          </Stack>
        </UnstyledButton>
      ),
    },
    {
      header: "Category",
      render: (r) => (
        <Badge variant="light" color="gray" size="sm">
          {SYSTEM_CONFIG.CATEGORY_LABELS[r.blocker.category]}
        </Badge>
      ),
    },
    {
      header: "Open for",
      render: (r) => (
        <Text size="sm" fw={600} c={r.daysOpen > SYSTEM_CONFIG.AGING_BLOCKER_WORKING_DAYS ? "red.7" : undefined}>
          {r.daysOpen} working day{r.daysOpen === 1 ? "" : "s"}
        </Text>
      ),
    },
    {
      header: "Who can clear it",
      render: (r) => <Text size="sm">{personName(r.blocker.ownerId)}</Text>,
    },
    {
      header: "Caused by",
      render: (r) =>
        r.causingTask ? (
          <UnstyledButton onClick={() => onTaskClick(r.causingTask!.id)}>
            <Text size="sm" c="teal.7">{r.causingTask.title}</Text>
          </UnstyledButton>
        ) : (
          <Text size="sm" c="dimmed">Not recorded</Text>
        ),
    },
  ];

  const toRows = (list: OpenBlockerRow[]): Row[] => list.map((r) => ({ ...r, id: r.blocker.id }));
  const categories = Object.keys(SYSTEM_CONFIG.CATEGORY_LABELS) as BlockerCategory[];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Group gap="xs">
          <IconBarrierBlock size={20} color="#fa5252" />
          <Text size="md" fw={700}>Open Blockers ({rows.length})</Text>
        </Group>
        <SegmentedControl
          size="xs"
          value={grouping}
          onChange={(value) => setGrouping(value as "age" | "category")}
          data={[
            { value: "age", label: "Longest open first" },
            { value: "category", label: "By category" },
          ]}
        />
      </Group>

      {grouping === "age" ? (
        <ReusableTable columns={columns} data={toRows(rows)} emptyLabel="No open blockers in your projects." />
      ) : (
        <Stack gap="md">
          {categories
            .map((category) => ({ category, list: rows.filter((r) => r.blocker.category === category) }))
            .filter(({ list }) => list.length > 0)
            .map(({ category, list }) => (
              <Stack key={category} gap={6}>
                <Text size="sm" fw={700}>
                  {SYSTEM_CONFIG.CATEGORY_LABELS[category]} ({list.length})
                </Text>
                <ReusableTable columns={columns} data={toRows(list)} />
              </Stack>
            ))}
          {rows.length === 0 && <Text size="sm" c="dimmed">No open blockers in your projects.</Text>}
        </Stack>
      )}
    </Paper>
  );
}
