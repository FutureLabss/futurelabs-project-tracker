import { Badge, Group, Tooltip } from '@mantine/core';
import type { MemberTaskFlags } from '../../../../api/hooks/use-member-task-flags';
import { SYSTEM_CONFIG } from '../../../../domain/config/system-thresholds';

export function TaskFlagBadges({ flags }: { flags: MemberTaskFlags }) {
  if (!flags.overdue && !flags.dueSoon && !flags.stale) return null;

  return (
    <Group gap={4}>
      {flags.overdue && (
        <Badge size="xs" color="red" variant="filled">
          OVERDUE
        </Badge>
      )}
      {flags.dueSoon && (
        <Tooltip
          label={`Not started and due within ${SYSTEM_CONFIG.IMMINENT_WARNING_WORKING_DAYS} working days`}
        >
          <Badge size="xs" color="orange" variant="light">
            DUE SOON
          </Badge>
        </Tooltip>
      )}
      {flags.stale && (
        <Tooltip
          label={`No change recorded for ${SYSTEM_CONFIG.STALE_INACTIVITY_WORKING_DAYS}+ working days`}
        >
          <Badge size="xs" color="yellow" variant="light">
            INACTIVE
          </Badge>
        </Tooltip>
      )}
    </Group>
  );
}
