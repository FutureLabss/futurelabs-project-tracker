import { Select } from '@mantine/core';
import { useProjectTaskTitles, useTaskById } from '../../../../api/hooks/use-tasks';

interface BlockingTaskSelectProps {
  taskId: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * FR-10: optionally record another task as the cause of a blocker.
 * Lists open tasks in the same project by title only, so members still never
 * see teammates' task details (FR-19).
 */
export function BlockingTaskSelect({ taskId, value, onChange }: BlockingTaskSelectProps) {
  const { data: task } = useTaskById(taskId);
  const { data: titles = [] } = useProjectTaskTitles(task?.projectId);

  const options = titles
    .filter((t) => t.id !== taskId)
    .map((t) => ({ value: t.id, label: t.title }));

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
