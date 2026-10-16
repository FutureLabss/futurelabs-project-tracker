import type { ReactNode } from "react";
import { Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { ReusableTable, type ColumnDef } from "../../../Table/ReusableTab";
import type { Task } from "../../../../entities/task.entity";

export interface TaskSignalRow {
  task: Task;
  projectName: string;
  assigneeName: string;
  detail: string;
}

interface TaskSignalPanelProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  rows: TaskSignalRow[];
  detailHeader: string;
  emptyLabel: string;
  onTaskClick: (taskId: string) => void;
}

/** A focused list of tasks for one signal (FR-37 aging work, FR-39 inactivity). */
export function TaskSignalPanel({
  title,
  subtitle,
  icon,
  rows,
  detailHeader,
  emptyLabel,
  onTaskClick,
}: TaskSignalPanelProps) {
  const columns: ColumnDef<TaskSignalRow & { id: string }>[] = [
    {
      header: "Task",
      render: (r) => (
        <UnstyledButton onClick={() => onTaskClick(r.task.id)}>
          <Text size="sm" fw={600}>{r.task.title}</Text>
        </UnstyledButton>
      ),
    },
    { header: "Project", render: (r) => <Text size="sm" c="dimmed">{r.projectName}</Text> },
    { header: "Assignee", render: (r) => <Text size="sm">{r.assigneeName}</Text> },
    { header: detailHeader, render: (r) => <Text size="sm">{r.detail}</Text> },
  ];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group gap="xs" mb="md">
        {icon}
        <Text size="md" fw={700}>
          {title} ({rows.length})
        </Text>
        <Text size="xs" c="dimmed">{subtitle}</Text>
      </Group>
      <ReusableTable columns={columns} data={rows.map((r) => ({ ...r, id: r.task.id }))} emptyLabel={emptyLabel} />
    </Paper>
  );
}
