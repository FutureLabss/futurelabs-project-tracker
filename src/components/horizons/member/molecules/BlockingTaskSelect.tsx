import { Select } from '@mantine/core';
import { useTaskById, useTasks } from '../../../../api/hooks/use-tasks';
import { usePersons } from '../../../../api/hooks/use-availability';

interface BlockingTaskSelectProps {
  taskId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Called with the picked task's owner, so "who can clear it" can default to them. */
  onOwnerSuggested?: (personId: string | null) => void;
}

/**
 * FR-10: optionally record another task in the same project as the cause of a
 * blocker. Each option shows the task's owner, so the member knows who is
 * holding them up — only the title and owner, nothing else about the task.
 */
export function BlockingTaskSelect({ taskId, value, onChange, onOwnerSuggested }: BlockingTaskSelectProps) {
  const { data: task } = useTaskById(taskId);
  const { data: projectTasks = [] } = useTasks(task ? { projectId: task.projectId } : undefined);
  const { data: people = [] } = usePersons();

  const candidates = task
    ? projectTasks.filter(
        (t) =>
          t.projectId === task.projectId &&
          t.id !== taskId &&
          t.status !== 'accepted' &&
          t.status !== 'cancelled',
      )
    : [];
  const ownerName = (id: string | null) => (id ? people.find((p) => p.id === id)?.name : undefined) ?? 'Unassigned';
  const options = candidates
    .map((t) => ({ value: t.id, label: `${t.title} · ${ownerName(t.assigneeId)}` }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Select
      label="Caused by another task (optional)"
      description="The task in this project that is holding you up, and who owns it"
      placeholder={options.length ? 'Select a task' : 'No other open tasks in this project'}
      data={options}
      value={value}
      onChange={(next) => {
        onChange(next);
        const picked = candidates.find((t) => t.id === next);
        if (picked) onOwnerSuggested?.(picked.assigneeId);
      }}
      disabled={!options.length}
      searchable
      clearable
    />
  );
}
