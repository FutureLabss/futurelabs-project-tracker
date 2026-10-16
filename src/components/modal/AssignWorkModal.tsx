import { useEffect, useState } from "react";
import { Alert, Group, SegmentedControl, Select, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { ReusableModal } from "./ReuseableModal";
import { isPastDueDate, PAST_DUE_DATE_MESSAGE } from "../../domain/calculations/due-dates";
import type { Person } from "../../entities/person.entity";
import type { Project } from "../../entities/project.entity";
import type { ProjectMember } from "../../entities/project-member.entity";
import type { TaskComplexity } from "../../entities/task.entity";

export interface AssignWorkFormValues {
  title: string;
  projectId: string;
  /** null leaves the task unassigned (FR-23). */
  assigneeId: string | null;
  complexity: TaskComplexity;
  dueDate: string;
  description: string;
}

interface AssignWorkModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: AssignWorkFormValues) => Promise<void>;
  loading?: boolean;
  /** Active projects the manager manages. */
  projects: Project[];
  people: Person[];
  members: ProjectMember[];
  managerId: string;
  date: string;
}

const UNASSIGNED = "__unassigned__";

/** FR-22 / FR-23: create a task in a managed project, for a project member or nobody yet. */
export function AssignWorkModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  projects,
  people,
  members,
  managerId,
  date,
}: AssignWorkModalProps) {
  const emptyForm = (): AssignWorkFormValues & { assignee: string } => ({
    title: "",
    projectId: projects.length === 1 ? projects[0].id : "",
    assigneeId: null,
    assignee: UNASSIGNED,
    complexity: "mid",
    dueDate: date,
    description: "",
  });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setForm(emptyForm());
      setError(null);
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  // Only people who can work on the chosen project: its members and the manager.
  const teamIds = new Set(members.filter((m) => m.projectId === form.projectId).map((m) => m.personId));
  const assignable = people.filter(
    (p) => p.status !== "inactive" && p.role !== "admin" && (teamIds.has(p.id) || p.id === managerId),
  );

  const submit = async () => {
    setError(null);
    if (!form.title.trim() || !form.projectId || !form.dueDate) {
      setError("A title, a project and a due date are required.");
      return;
    }
    if (isPastDueDate(form.dueDate, date)) {
      setError(PAST_DUE_DATE_MESSAGE);
      return;
    }
    try {
      await onSubmit({
        title: form.title.trim(),
        projectId: form.projectId,
        assigneeId: form.assignee === UNASSIGNED ? null : form.assignee,
        complexity: form.complexity,
        dueDate: form.dueDate,
        description: form.description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The task could not be created.");
    }
  };

  return (
    <ReusableModal
      opened={opened}
      onClose={onClose}
      title="Assign Work"
      submitLabel="Create task"
      loading={loading}
      onSubmit={submit}
    >
      <Stack gap="sm">
        {projects.length === 0 && (
          <Alert color="orange" variant="light">
            You don't manage any active project yet. Create one on the Projects tab first.
          </Alert>
        )}
        <TextInput
          label="Task title"
          placeholder="e.g. Implement SMS 2FA fallback"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
        />
        <Select
          label="Project"
          placeholder="Select one of your projects"
          data={projects.map((p) => ({ value: p.id, label: p.name }))}
          value={form.projectId || null}
          onChange={(value) => setForm({ ...form, projectId: value ?? "", assignee: UNASSIGNED })}
          searchable
          allowDeselect={false}
          required
        />
        <Select
          label="Assignee"
          description={
            form.projectId && assignable.length <= 1
              ? "Add people to this project from its Team button on the Projects tab."
              : undefined
          }
          data={[
            { value: UNASSIGNED, label: "Unassigned" },
            ...assignable.map((p) => ({ value: p.id, label: p.id === managerId ? `${p.name} (me)` : p.name })),
          ]}
          value={form.assignee}
          onChange={(value) => setForm({ ...form, assignee: value ?? UNASSIGNED })}
          disabled={!form.projectId}
          searchable
          allowDeselect={false}
        />
        <Group grow align="flex-start">
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Complexity
            </Text>
            <SegmentedControl
              value={form.complexity}
              onChange={(value) => setForm({ ...form, complexity: value as TaskComplexity })}
              data={[
                { value: "low", label: "Low (1)" },
                { value: "mid", label: "Mid (2)" },
                { value: "high", label: "High (3)" },
              ]}
            />
          </Stack>
          <TextInput
            type="date"
            label="Due date"
            required
            min={date}
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.currentTarget.value })}
          />
        </Group>
        <Textarea
          label="Description (optional)"
          autosize
          minRows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
        />
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}
      </Stack>
    </ReusableModal>
  );
}
