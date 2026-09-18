import { Badge } from '@mantine/core';

type Complexity =
  | 'LOW (1 PT)'
  | 'MID (2 PTS)'
  | 'HIGH (3 PTS)';

type TaskStatus =
  | 'NOT STARTED'
  | 'IN PROGRESS'
  | 'BLOCKED'
  | 'ACCEPTED';

export function ComplexityBadge({
  value,
}: {
  value: Complexity;
}) {
  const color =
    value === 'HIGH (3 PTS)'
      ? 'grape'
      : value === 'MID (2 PTS)'
        ? 'blue'
        : 'teal';

  return (
    <Badge
      size="xs"
      color={color}
      variant="light"
      styles={{
        root: {
          whiteSpace: 'nowrap',
        },
      }}
    >
      {value}
    </Badge>
  );
}

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

export function OverdueBadge() {
  return (
    <Badge
      size="xs"
      color="red"
      variant="filled"
    >
      OVERDUE
    </Badge>
  );
}

export function BlockedBadge() {
  return (
    <Badge
      size="xs"
      color="red"
      variant="light"
    >
      ⚠ BLOCKED
    </Badge>
  );
}