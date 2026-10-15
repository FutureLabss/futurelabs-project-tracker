import { useState } from "react";
import { Badge, Group, Paper, SegmentedControl, Text, TextInput } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ReusableTable, type ColumnDef } from "../../../Table/ReusableTab";
import type { Person } from "../../../../entities/person.entity";
import type { Project } from "../../../../entities/project.entity";
import type { Task } from "../../../../entities/task.entity";
import { SYSTEM_CONFIG } from "../../../../domain/config/system-thresholds";

interface ManagerHistoryProps {
  /** All tasks the manager can read. */
  tasks: Task[];
  projects: Project[];
  people: Person[];
  actorId: string;
  managedProjectIds: Set<string>;
  date: string;
  onTaskClick: (taskId: string) => void;
}

type Scope = "mine" | "projects";

/**
 * FR-18 for the manager's own work (in any project), plus everything accepted
 * in the projects they manage, for a period they choose.
 */
export function ManagerHistory({
  tasks,
  projects,
  people,
  actorId,
  managedProjectIds,
  date,
  onTaskClick,
}: ManagerHistoryProps) {
  const [scope, setScope] = useState<Scope>("mine");
  const [from, setFrom] = useState(dayjs(date).startOf("month").format("YYYY-MM-DD"));
  const [to, setTo] = useState(date);

  const personName = (id: string | null) => (id ? (people.find((p) => p.id === id)?.name ?? "—") : "Unassigned");
  const acceptedOn = (task: Task) => dayjs(task.acceptedAt).format("YYYY-MM-DD");

  const rows = tasks
    .filter((t) => t.status === "accepted" && t.acceptedAt)
    .filter((t) => (scope === "mine" ? t.assigneeId === actorId : managedProjectIds.has(t.projectId)))
    .filter((t) => (!from || acceptedOn(t) >= from) && (!to || acceptedOn(t) <= to))
    .sort((a, b) => (b.acceptedAt ?? "").localeCompare(a.acceptedAt ?? ""));
  const points = rows.reduce((sum, t) => sum + (SYSTEM_CONFIG.COMPLEXITY_WEIGHTS[t.complexity] ?? 0), 0);

  const columns: ColumnDef<Task>[] = [
    { header: "Task", render: (t) => <Text size="sm" fw={600}>{t.title}</Text> },
    { header: "Project", render: (t) => <Text size="sm" c="dimmed">{projects.find((p) => p.id === t.projectId)?.name ?? "—"}</Text> },
    ...(scope === "projects"
      ? [{ header: "Assignee", render: (t: Task) => <Text size="sm">{personName(t.assigneeId)}</Text> }]
      : []),
    { header: "Complexity", render: (t) => <Badge variant="outline" size="sm">{t.complexity.toUpperCase()}</Badge> },
    { header: "Accepted on", render: (t) => <Text size="sm">{acceptedOn(t)}</Text> },
    { header: "Accepted by", render: (t) => <Text size="sm">{personName(t.acceptedBy)}</Text> },
  ];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group justify="space-between" align="flex-end" mb="md" wrap="wrap">
        <Group gap="xs">
          <IconTrophy size={20} color="#20c997" />
          <Text size="md" fw={700}>Accepted Work</Text>
          <Text size="xs" c="dimmed">
            {rows.length} task{rows.length === 1 ? "" : "s"} · {points} pts in this period
          </Text>
        </Group>
        <Group gap="xs" align="flex-end" wrap="wrap">
          <SegmentedControl
            size="xs"
            value={scope}
            onChange={(value) => setScope(value as Scope)}
            data={[
              { value: "mine", label: "My work" },
              { value: "projects", label: "My projects" },
            ]}
          />
          <TextInput type="date" size="xs" label="From" value={from} max={to || undefined} onChange={(e) => setFrom(e.currentTarget.value)} />
          <TextInput type="date" size="xs" label="To" value={to} min={from || undefined} onChange={(e) => setTo(e.currentTarget.value)} />
        </Group>
      </Group>
      <ReusableTable
        columns={columns}
        data={rows}
        onRowClick={(t) => onTaskClick(t.id)}
        emptyLabel={
          scope === "mine"
            ? "None of your own tasks were accepted in this period."
            : "Nothing was accepted in your projects in this period."
        }
      />
    </Paper>
  );
}
