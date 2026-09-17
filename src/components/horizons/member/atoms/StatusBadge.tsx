import { Badge } from '@mantine/core';

type TaskStatus =
  | 'NOT STARTED'
  | 'IN PROGRESS'
  | 'BLOCKED'
  | 'ACCEPTED';

export function StatusBadge({
  status,
}: {
  status: TaskStatus;
}) {
  const color =
    status === 'BLOCKED'
      ? 'red'
      : status === 'ACCEPTED'
        ? 'teal'
        : status === 'IN PROGRESS'
          ? 'blue'
          : 'gray';

  return (
    <Badge
      size="xs"
      color={color}
      variant={
        status === 'ACCEPTED'
          ? 'filled'
          : 'light'
      }
    >
      {status}
    </Badge>
  );
}
