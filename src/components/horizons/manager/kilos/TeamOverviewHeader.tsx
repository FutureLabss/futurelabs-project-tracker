import { Box, Group, Title, Text, Button, Badge, SimpleGrid } from '@mantine/core';
import { IconChecklist, IconUserPlus } from '@tabler/icons-react';
import { MetricDotCard } from '../alpha/MetricDotCard';
import { SYSTEM_CONFIG } from '../../../../domain/config/system-thresholds';

export interface TeamOverviewMetrics {
  reviewQueueCount: number;
  /** Working days the longest-waiting submission has waited; null when the queue is empty. */
  oldestWaitingDays: number | null;
  activeBlockersCount: number;
  agingBlockersCount: number;
  openWeight: number;
  openPeopleCount: number;
  agingWipCount: number;
}

interface TeamOverviewHeaderProps {
  /** Summary cards are shown on the Team overview only. */
  metrics?: TeamOverviewMetrics;
  /** Each button only renders when its handler is given for the current tab. */
  onAssignWork?: () => void;
  onReviewSubmissions?: () => void;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function TeamOverviewHeader({ metrics, onAssignWork, onReviewSubmissions }: TeamOverviewHeaderProps) {
  return (
    <Box>
      <Group justify="space-between" align="flex-start" mb={metrics ? 'lg' : 0}>
        <Box>
          <Badge color="grape" variant="light" size="sm" mb={4}>
            MANAGER
          </Badge>
          <Title order={1} fw={900} fz={28} c="dark.9">
            Team delivery command
          </Title>
          <Text size="sm" c="dimmed">
            Review submitted work, rebalance load, and remove delivery blockers.
          </Text>
        </Box>
        <Group>
          {onReviewSubmissions && (
            <Button
              leftSection={<IconChecklist size={16} />}
              color="teal"
              onClick={onReviewSubmissions}
            >
              Review submissions
            </Button>
          )}
          {onAssignWork && (
            <Button
              leftSection={<IconUserPlus size={16} />}
              color="teal"
              onClick={onAssignWork}
            >
              Assign work
            </Button>
          )}
        </Group>
      </Group>

      {metrics && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <MetricDotCard
            label="REVIEW QUEUE"
            value={metrics.reviewQueueCount}
            subtext={
              metrics.oldestWaitingDays === null
                ? 'Nothing waiting for review'
                : `Oldest waiting ${plural(metrics.oldestWaitingDays, 'working day')}`
            }
            dotColor="#b197fc"
          />
          <MetricDotCard
            label="ACTIVE BLOCKERS"
            value={metrics.activeBlockersCount}
            subtext={
              metrics.activeBlockersCount === 0
                ? 'No open blockers'
                : `${metrics.agingBlockersCount} open longer than ${SYSTEM_CONFIG.AGING_BLOCKER_WORKING_DAYS} working days`
            }
            dotColor="#ffd43b"
          />
          <MetricDotCard
            label="OPEN WORK"
            value={`${metrics.openWeight} pts`}
            subtext={
              metrics.openWeight === 0
                ? 'No open work in your projects'
                : `Complexity points across ${plural(metrics.openPeopleCount, 'person').replace('persons', 'people')}`
            }
            dotColor="#63e6be"
          />
          <MetricDotCard
            label="AGING WIP"
            value={metrics.agingWipCount}
            subtext="In progress past the complexity threshold"
            dotColor="#ff8787"
          />
        </SimpleGrid>
      )}
    </Box>
  );
}
