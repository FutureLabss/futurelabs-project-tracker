import { Badge } from '@mantine/core';

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
