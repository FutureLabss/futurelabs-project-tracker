import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { IconFolder, IconFolderPlus, IconLock } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ReusableTable, type ColumnDef } from "../../../Table/ReusableTab";
import type { ProjectForecastRow } from "../../../../domain/calculations/manager-insights";
import {
  useCloseManagedProject,
  useCreateManagedProject,
} from "../../../../api/hooks/use-manager-actions";

interface ManagedProjectsPanelProps {
  rows: ProjectForecastRow[];
  actorId: string;
  date: string;
  recentWeeks: number;
}

const formatRate = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

/** FR-20 / FR-21 / FR-45 / FR-46 */
export function ManagedProjectsPanel({ rows, actorId, date, recentWeeks }: ManagedProjectsPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [closing, setClosing] = useState<ProjectForecastRow | null>(null);
  const [form, setForm] = useState({ name: "", goal: "", startDate: date, targetDate: date });
  const [error, setError] = useState<string | null>(null);
  const createProject = useCreateManagedProject();
  const closeProject = useCloseManagedProject();

  const openCreate = () => {
    setForm({ name: "", goal: "", startDate: date, targetDate: dayjs(date).add(1, "month").format("YYYY-MM-DD") });
    setError(null);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    setError(null);
    if (!form.name.trim() || !form.goal.trim()) {
      setError("A name and a goal are required.");
      return;
    }
    try {
      await createProject.mutateAsync({ ...form, name: form.name.trim(), goal: form.goal.trim(), actorId });
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The project could not be created.");
    }
  };

  const submitClose = async () => {
    if (!closing) return;
    setError(null);
    try {
      await closeProject.mutateAsync({ projectId: closing.project.id, actorId });
      setClosing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The project could not be closed.");
    }
  };

  const columns: ColumnDef<ProjectForecastRow & { id: string }>[] = [
    {
      header: "Project",
      render: (r) => (
        <Stack gap={2}>
          <Text size="sm" fw={600}>{r.project.name}</Text>
          <Text size="xs" c="dimmed" lineClamp={1}>{r.project.goal}</Text>
        </Stack>
      ),
    },
    {
      header: "Target",
      render: (r) => (
        <Stack gap={2}>
          <Text size="sm">{r.project.targetDate}</Text>
          <Badge size="xs" variant="light" color={r.project.state === "active" ? "teal" : "gray"}>
            {r.project.state.toUpperCase()}
          </Badge>
        </Stack>
      ),
    },
    {
      header: "Remaining work",
      render: (r) => (
        <Text size="sm">
          <Text span fw={700}>{r.remainingWeight} pts</Text>{" "}
          <Text span c="dimmed" size="xs">({r.openTasks} open)</Text>
        </Text>
      ),
    },
    {
      header: `Accepted, last ${recentWeeks} weeks`,
      render: (r) => (
        <Text size="sm">
          {r.acceptedWeightRecent} pts{" "}
          <Text span c="dimmed" size="xs">({formatRate(r.weeklyAcceptanceRate)} pts/week)</Text>
        </Text>
      ),
    },
    {
      header: "Forecast",
      render: (r) => (
        <Text size="sm" c={r.weeksToFinish === null ? "dimmed" : undefined}>
          {r.weeksToFinish === 0
            ? "Nothing left"
            : r.weeksToFinish === null
              ? "No recent acceptances"
              : `~${Math.ceil(r.weeksToFinish)} week${Math.ceil(r.weeksToFinish) === 1 ? "" : "s"} at this rate`}
        </Text>
      ),
    },
    {
      header: "Due dates moved later",
      render: (r) => (
        <Badge variant="light" color={r.slipCount >= 2 ? "orange" : "gray"}>
          {r.slipCount}
        </Badge>
      ),
    },
    {
      header: "",
      render: (r) =>
        r.project.state === "active" ? (
          <Tooltip label={r.openTasks > 0 ? "Accept or cancel all open tasks first" : "Close this project"}>
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconLock size={14} />}
              disabled={r.openTasks > 0}
              onClick={() => {
                setError(null);
                setClosing(r);
              }}
            >
              Close
            </Button>
          </Tooltip>
        ) : null,
    },
  ];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconFolder size={20} color="#20c997" />
          <Text size="md" fw={700}>My Projects</Text>
        </Group>
        <Button size="sm" leftSection={<IconFolderPlus size={16} />} onClick={openCreate}>
          New project
        </Button>
      </Group>

      <ReusableTable
        columns={columns}
        data={rows.map((r) => ({ ...r, id: r.project.id }))}
        emptyLabel="You don't manage any projects yet. Create one to get started."
      />

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="New project" centered>
        <Stack gap="sm">
          <TextInput
            label="Project name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <Textarea
            label="Goal"
            required
            autosize
            minRows={2}
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.currentTarget.value })}
          />
          <Group grow>
            <TextInput
              type="date"
              label="Start date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.currentTarget.value })}
            />
            <TextInput
              type="date"
              label="Target date"
              required
              min={form.startDate}
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.currentTarget.value })}
            />
          </Group>
          <Text size="xs" c="dimmed">You will be this project's manager.</Text>
          {error && <Alert color="red" variant="light">{error}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCreateOpen(false)}>Back</Button>
            <Button loading={createProject.isPending} onClick={submitCreate}>Create project</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={closing !== null} onClose={() => setClosing(null)} title="Close project" centered>
        <Stack gap="sm">
          <Text size="sm">
            Close <Text span fw={600}>{closing?.project.name}</Text>? Closed projects keep their full history but take no new work.
          </Text>
          {error && <Alert color="red" variant="light">{error}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setClosing(null)}>Back</Button>
            <Button color="gray" loading={closeProject.isPending} onClick={submitClose}>Close project</Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
