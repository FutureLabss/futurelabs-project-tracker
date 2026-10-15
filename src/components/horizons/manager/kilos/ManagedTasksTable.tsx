import { useState } from "react";
import { Badge, Group, Paper, Select, Text } from "@mantine/core";
import { IconListDetails } from "@tabler/icons-react";
import { ReusableTable, type ColumnDef } from "../../../Table/ReusableTab";
import type { Person } from "../../../../entities/person.entity";
import type { Project } from "../../../../entities/project.entity";
import type { Task } from "../../../../entities/task.entity";

interface ManagedTasksTableProps {
  tasks: Task[];
  projects: Project[];
  people: Person[];
  onTaskClick: (taskId: string) => void;
}

const STATUS_COLORS: Record<Task["status"], string> = {
  not_started: "gray",
  in_progress: "blue",
  blocked: "red",
  submitted: "violet",
  accepted: "teal",
  cancelled: "dark",
};

type StatusFilter = "open" | "accepted" | "cancelled" | "all";

/** Every task in the manager's projects; clicking one opens the inspector and its controls. */
export function ManagedTasksTable({ tasks, projects, people, onTaskClick }: ManagedTasksTableProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("open");

  const visible = tasks
    .filter((t) => !projectId || t.projectId === projectId)
    .filter((t) => {
      if (status === "all") return true;
      if (status === "open") return t.status !== "accepted" && t.status !== "cancelled";
      return t.status === status;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const columns: ColumnDef<Task>[] = [
    { header: "Task", render: (t) => <Text size="sm" fw={600}>{t.title}</Text> },
    { header: "Project", render: (t) => <Text size="sm" c="dimmed">{projects.find((p) => p.id === t.projectId)?.name ?? "—"}</Text> },
    {
      header: "Assignee",
      render: (t) => <Text size="sm">{t.assigneeId ? (people.find((p) => p.id === t.assigneeId)?.name ?? "—") : "Unassigned"}</Text>,
    },
    { header: "Complexity", render: (t) => <Badge variant="outline" size="sm">{t.complexity.toUpperCase()}</Badge> },
    { header: "Due", render: (t) => <Text size="sm">{t.dueDate}</Text> },
    {
      header: "Status",
      render: (t) => (
        <Badge variant="light" size="sm" color={STATUS_COLORS[t.status]}>
          {t.status.replace("_", " ").toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Group gap="xs">
          <IconListDetails size={20} color="#20c997" />
          <Text size="md" fw={700}>Tasks in My Projects ({visible.length})</Text>
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
            allowDeselect={false}
            data={[
              { value: "open", label: "Open" },
              { value: "accepted", label: "Accepted" },
              { value: "cancelled", label: "Cancelled" },
              { value: "all", label: "All statuses" },
            ]}
            value={status}
            onChange={(value) => setStatus((value as StatusFilter) ?? "open")}
          />
        </Group>
      </Group>
      <ReusableTable
        columns={columns}
        data={visible}
        onRowClick={(t) => onTaskClick(t.id)}
        emptyLabel="No tasks match these filters."
      />
    </Paper>
  );
}
