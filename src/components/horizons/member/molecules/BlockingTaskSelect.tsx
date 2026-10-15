import { Select } from '@mantine/core';
import { useTaskById, useTasks } from '../../../../api/hooks/use-tasks';

interface BlockingTaskSelectProps {
  taskId: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * FR-10: optionally record another task as the cause of a blocker.
 * Lists open tasks in the same project by title only.
 */
export function BlockingTaskSelect({ taskId, value, onChange }: BlockingTaskSelectProps) {
  const { data: task } = useTaskById(taskId);
  const { data: projectTasks = [] } = useTasks(
    task ? { projectId: task.projectId } : undefined,
  );

  const options = task
    ? projectTasks
        .filter(
          (t) =>
            t.projectId === task.projectId &&
            t.id !== taskId &&
            t.status !== 'accepted' &&
            t.status !== 'cancelled',
        )
        .map((t) => ({ value: t.id, label: t.title }))
    : [];

  return (
    <Select
      label="Caused by another task (optional)"
      description="Pick the task in this project that is holding you up, if there is one"
      placeholder={options.length ? 'Select a task' : 'No other open tasks in this project'}
      data={options}
      value={value}
      onChange={onChange}
      disabled={!options.length}
      searchable
      clearable
    />
  );
}
