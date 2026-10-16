import { Badge, Group, Paper, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconArrowNarrowLeft, IconArrowNarrowRight, IconLink } from '@tabler/icons-react';
import { useBlockers } from '../../../../api/hooks/use-blockers';
import { usePersons } from '../../../../api/hooks/use-availability';
import { useTasks } from '../../../../api/hooks/use-tasks';
import { getWorkingDaysElapsed } from '../../../../domain/calculations/working-days';
import type { Task } from '../../../../entities/task.entity';

interface LinkedWorkPanelProps {
  personId: string;
  date: string;
  onTaskClick: (taskId: string) => void;
}

const statusLabel = (status: Task['status']) => status.replace('_', ' ');

/**
 * Teammates' work that is linked to yours through an open blocker, and nothing
 * else (a narrow, agreed exception to FR-19):
 * - Blocking you: the task (and owner) your blocked task is waiting on.
 * - Waiting on you: teammates blocked on you, or on one of your tasks.
 * Each link disappears as soon as its blocker is cleared.
 */
export function LinkedWorkPanel({ personId, date, onTaskClick }: LinkedWorkPanelProps) {
  const { data: blockers = [] } = useBlockers();
  const { data: tasks = [] } = useTasks();
  const { data: people = [] } = usePersons();

  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const name = (id: string | null | undefined) => (id ? people.find((p) => p.id === id)?.name : undefined) ?? 'Unassigned';
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
      theirTask: taskById.get(b.taskId),
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

  return (
    <Paper withBorder radius="md" p="md">
      <Group gap="xs" mb="sm">
        <IconLink size={18} color="var(--mantine-color-teal-6)" />
        <Text fw={700}>Linked work</Text>
        <Text size="xs" c="dimmed">
          Teammates' tasks connected to yours through a blocker
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Stack gap={6}>
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
            <UnstyledButton key={blocker.id} onClick={() => onTaskClick(myTask.id)}>
              <Stack gap={2}>
                <Text size="sm" fw={600}>
                  {myTask.title}
                </Text>
                <Text size="xs" c="dimmed">
                  {cause ? (
                    <>
                      Waiting on <b>{cause.title}</b> · {name(cause.assigneeId)}{' '}
                      <Badge size="xs" variant="light" color="gray">
                        {statusLabel(cause.status)}
                      </Badge>
                    </>
                  ) : (
                    <>Waiting on {name(blocker.ownerId)}</>
                  )}{' '}
                  · {days(blocker.raisedAt)}
                </Text>
              </Stack>
            </UnstyledButton>
          ))}
        </Stack>

        <Stack gap={6}>
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
          {waitingOnMe.map(({ blocker, theirTask, myCause }) => (
            <UnstyledButton
              key={blocker.id}
              onClick={() => myCause?.assigneeId === personId && onTaskClick(myCause.id)}
              style={{ cursor: myCause?.assigneeId === personId ? 'pointer' : 'default' }}
            >
              <Stack gap={2}>
                <Text size="sm">
                  <b>{name(theirTask!.assigneeId)}</b> is blocked on <b>{theirTask!.title}</b>
                </Text>
                <Text size="xs" c="dimmed">
                  {myCause?.assigneeId === personId ? <>Because of your task {myCause.title} · </> : null}
                  {blocker.description} · {days(blocker.raisedAt)}
                </Text>
              </Stack>
            </UnstyledButton>
          ))}
        </Stack>
      </SimpleGrid>
    </Paper>
  );
}
