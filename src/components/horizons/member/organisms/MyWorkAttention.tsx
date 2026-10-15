import { Alert, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { Task } from '../../../../entities/task.entity';
import type { MemberTaskFlags } from '../../../../api/hooks/use-member-task-flags';
import { TaskFlagBadges } from '../atoms/TaskFlagBadges';

interface MyWorkAttentionProps {
  tasks: Task[];
  getFlags: (task: Task) => MemberTaskFlags;
  onTaskClick: (taskId: string) => void;
}

// Overdue and stale together is the highest-risk combination, so it leads.
function priority(flags: MemberTaskFlags) {
  if (flags.overdue && flags.stale) return 0;
  if (flags.overdue) return 1;
  if (flags.dueSoon) return 2;
  return 3;
}

/** Private, IC-first warnings: shown to the assignee before anyone escalates. */
export function MyWorkAttention({ tasks, getFlags, onTaskClick }: MyWorkAttentionProps) {
  const flagged = tasks
    .map((task) => ({ task, flags: getFlags(task) }))
    .filter(({ flags }) => flags.overdue || flags.dueSoon || flags.stale)
    .sort((a, b) => priority(a.flags) - priority(b.flags) || a.task.dueDate.localeCompare(b.task.dueDate));

  if (flagged.length === 0) return null;

  return (
    <Alert
      color="orange"
      variant="light"
      radius="md"
      icon={<IconAlertTriangle size={18} />}
      title={`${flagged.length} task${flagged.length === 1 ? '' : 's'} need${flagged.length === 1 ? 's' : ''} your attention`}
    >
      <Stack gap={6}>
        {flagged.map(({ task, flags }) => (
          <UnstyledButton key={task.id} onClick={() => onTaskClick(task.id)}>
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Text size="sm" fw={500} lineClamp={1}>
                {task.title}
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed">
                  Due {task.dueDate}
                </Text>
                <TaskFlagBadges flags={flags} />
              </Group>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>
    </Alert>
  );
}
