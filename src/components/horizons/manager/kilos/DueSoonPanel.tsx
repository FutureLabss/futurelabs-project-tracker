import { Badge, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { IconHourglassLow } from "@tabler/icons-react";
import { ReusableTable, type ColumnDef } from "../../../Table/ReusableTab";
import type { Person } from "../../../../entities/person.entity";
import type { Project } from "../../../../entities/project.entity";
import type { DueSoonRow } from "../../../../domain/calculations/manager-insights";
import { SYSTEM_CONFIG } from "../../../../domain/config/system-thresholds";

interface DueSoonPanelProps {
  rows: DueSoonRow[];
  projects: Project[];
  people: Person[];
  onTaskClick: (taskId: string) => void;
}

type Row = DueSoonRow & { id: string };

/** FR-38: not-started work due soon, ordered by working days remaining. */
export function DueSoonPanel({ rows, projects, people, onTaskClick }: DueSoonPanelProps) {
  const columns: ColumnDef<Row>[] = [
    {
      header: "Task",
      render: (r) => (
        <UnstyledButton onClick={() => onTaskClick(r.task.id)}>
          <Text size="sm" fw={600}>{r.task.title}</Text>
        </UnstyledButton>
      ),
    },
    {
      header: "Project",
      render: (r) => <Text size="sm" c="dimmed">{projects.find((p) => p.id === r.task.projectId)?.name ?? "—"}</Text>,
    },
    {
      header: "Assignee",
      render: (r) => (
        <Text size="sm">{r.task.assigneeId ? (people.find((p) => p.id === r.task.assigneeId)?.name ?? "—") : "Unassigned"}</Text>
      ),
    },
    { header: "Due", render: (r) => <Text size="sm">{r.task.dueDate}</Text> },
    {
      header: "Working days left",
      render: (r) => (
        <Badge variant="light" color={r.workingDaysRemaining === 0 ? "red" : "orange"}>
          {r.workingDaysRemaining === 0 ? "Due today" : r.workingDaysRemaining}
        </Badge>
      ),
    },
  ];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group gap="xs" mb="md">
        <IconHourglassLow size={20} color="#fd7e14" />
        <Text size="md" fw={700}>Not Started, Due Soon ({rows.length})</Text>
        <Text size="xs" c="dimmed">Within {SYSTEM_CONFIG.IMMINENT_WARNING_WORKING_DAYS} working days</Text>
      </Group>
      <ReusableTable
        columns={columns}
        data={rows.map((r) => ({ ...r, id: r.task.id }))}
        emptyLabel="Nothing unstarted is due soon."
      />
    </Paper>
  );
}
