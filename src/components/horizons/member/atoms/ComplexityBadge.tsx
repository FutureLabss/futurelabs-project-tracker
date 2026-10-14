import { Badge } from '@mantine/core';

type Complexity =
  | 'LOW (1 PT)'
  | 'MID (2 PTS)'
  | 'HIGH (3 PTS)';

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
