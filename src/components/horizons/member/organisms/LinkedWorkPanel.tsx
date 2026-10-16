import { Anchor, Badge, Button, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconArrowNarrowLeft, IconArrowNarrowRight, IconCheck, IconLink } from '@tabler/icons-react';
import { useBlockers } from '../../../../api/hooks/use-blockers';
import { usePersons } from '../../../../api/hooks/use-availability';
import { useTasks } from '../../../../api/hooks/use-tasks';
import { getWorkingDaysElapsed } from '../../../../domain/calculations/working-days';
import type { Task } from '../../../../entities/task.entity';

interface LinkedWorkPanelProps {
  personId: string;
  date: string;
  /** Opens a task in the details drawer (read-only when it is not yours). */
  onTaskClick: (taskId: string) => void;
  /** Clears a blocker you were named to clear. */
  onClearBlocker: (request: { taskId: string; blockerId: string; taskTitle: string }) => void;
}

const statusLabel = (status: Task['status']) => status.replace('_', ' ');

/**
 * Teammates' work that is linked to yours through an open blocker, and nothing
 * else (a narrow, agreed exception to FR-19):
 * - Blocking you: the task (and owner) your blocked task is waiting on.
 * - Waiting on you: teammates blocked on you, or on one of your tasks.
 * Each link disappears as soon as its blocker is cleared.
 */
export function LinkedWorkPanel({ personId, date, onTaskClick, onClearBlocker }: LinkedWorkPanelProps) {
  const { data: blockers = [] } = useBlockers();
  const { data: tasks = [] } = useTasks();
  const { data: people = [] } = usePersons();

  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const name = (id: string | null | undefined) => (id ? people.find((p) => p.id === id)?.name : undefined);
  const open = blockers.filter((b) => !b.clearedAt);

  // My blocked tasks and what they wait on.
  const blockingMe = open
    .map((b) => ({ blocker: b, myTask: taskById.get(b.taskId) }))
    .filter(({ myTask }) => myTask?.assigneeId === personId)
    .map(({ blocker, myTask }) => ({
      blocker,
      myTask: myTask!,
      cause: blocker.blockingTaskId ? taskById.get(blocker.blockingTaskId) : undefined,
    }))
    .filter(({ blocker, cause }) => cause || blocker.ownerId !== personId);

  // Teammates blocked on me: named as the person who can clear it, or on one of my tasks.
  const waitingOnMe = open
    .map((b) => ({
      blocker: b,
      theirTask: taskById.get(b.taskId)!,
      myCause: b.blockingTaskId ? taskById.get(b.blockingTaskId) : undefined,
    }))
    .filter(
      ({ blocker, theirTask, myCause }) =>
        theirTask &&
        theirTask.assigneeId !== personId &&
        (blocker.ownerId === personId || myCause?.assigneeId === personId),
    );

  if (blockingMe.length === 0 && waitingOnMe.length === 0) return null;

  const days = (raisedAt: string) => {
    const n = getWorkingDaysElapsed(raisedAt, date);
    return `${n} working day${n === 1 ? '' : 's'}`;
  };

  const taskLink = (task: Task) => (
    <Anchor component="button" type="button" size="sm" fw={600} onClick={() => onTaskClick(task.id)}>
      {task.title}
    </Anchor>
  );

  return (
    <Paper withBorder radius="md" p="md">
      <Group gap="xs" mb="sm">
        <IconLink size={18} color="var(--mantine-color-teal-6)" />
        <Text fw={700}>Linked work</Text>
        <Text size="xs" c="dimmed">
          Teammates' tasks connected to yours through a blocker. Click a task to see its details.
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Stack gap="sm">
          <Group gap={6}>
            <IconArrowNarrowLeft size={16} />
            <Text size="sm" fw={600}>
              Blocking you ({blockingMe.length})
            </Text>
          </Group>
          {blockingMe.length === 0 && (
            <Text size="sm" c="dimmed">
              Nothing is holding up your work.
            </Text>
          )}
          {blockingMe.map(({ blocker, myTask, cause }) => (
            <Stack key={blocker.id} gap={2}>
              {taskLink(myTask)}
              <Text size="xs" c="dimmed" component="div">
                {cause ? (
                  <Group gap={4} wrap="wrap">
                    <span>Waiting on</span>
                    <Anchor component="button" type="button" size="xs" onClick={() => onTaskClick(cause.id)}>
                      {cause.title}
                    </Anchor>
                    <span>· {name(cause.assigneeId) ?? 'no owner yet'}</span>
                    <Badge size="xs" variant="light" color="gray">
                      {statusLabel(cause.status)}
                    </Badge>
                    <span>· {days(blocker.raisedAt)}</span>
                  </Group>
                ) : (
                  <>
                    Waiting on {name(blocker.ownerId) ?? 'someone'} · {days(blocker.raisedAt)}
                  </>
                )}
              </Text>
            </Stack>
          ))}
        </Stack>

        <Stack gap="sm">
          <Group gap={6}>
            <IconArrowNarrowRight size={16} />
            <Text size="sm" fw={600}>
              Waiting on you ({waitingOnMe.length})
            </Text>
          </Group>
          {waitingOnMe.length === 0 && (
            <Text size="sm" c="dimmed">
              Nobody is waiting on you.
            </Text>
          )}
          {waitingOnMe.map(({ blocker, theirTask, myCause }) => {
            const owner = name(theirTask.assigneeId);
            return (
              <Group key={blocker.id} justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                <Stack gap={2}>
                  <Group gap={4} wrap="wrap">
                    {taskLink(theirTask)}
                    <Text size="sm">is blocked{owner ? <> · {owner}</> : null}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {myCause?.assigneeId === personId ? <>Because of your task {myCause.title} · </> : null}
                    "{blocker.description}" · {days(blocker.raisedAt)}
                  </Text>
                </Stack>
                {/* The person named to clear a blocker may clear it (database rule). */}
                {blocker.ownerId === personId && (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconCheck size={14} />}
                    onClick={() =>
                      onClearBlocker({ taskId: theirTask.id, blockerId: blocker.id, taskTitle: theirTask.title })
                    }
                  >
                    Clear blocker
                  </Button>
                )}
              </Group>
            );
          })}
        </Stack>
      </SimpleGrid>
    </Paper>
  );
}
