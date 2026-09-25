import { Box, Group, Title, Text, Button, Badge, SimpleGrid } from '@mantine/core';
import { IconChecklist, IconUserPlus } from '@tabler/icons-react';
import { MetricDotCard } from '../alpha/MetricDotCard';

interface TeamOverviewHeaderProps {
  reviewQueueCount: number;
  activeBlockersCount: number;
  capacityPercent: number;
  totalMembersCount: number;
  agingWipCount: number;
  onAssignWork: () => void;
  onReviewSubmissions: () => void;
  onNavigateToRisk: () => void;
}

export function TeamOverviewHeader({
  reviewQueueCount,
  activeBlockersCount,
  capacityPercent,
  totalMembersCount,
  agingWipCount,
  onAssignWork,
  onReviewSubmissions,
  onNavigateToRisk,
}: TeamOverviewHeaderProps) {
  return (
    <Box>
      <Group justify="space-between" align="flex-start" mb="lg">
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
          <Button
            leftSection={<IconChecklist size={16} />}
            color="teal"
            onClick={onReviewSubmissions}
          >
            Review submissions
          </Button>
          <Button
            leftSection={<IconUserPlus size={16} />}
            color="teal"
            onClick={onAssignWork}
          >
            Assign work
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <MetricDotCard
          label="REVIEW QUEUE"
          value={reviewQueueCount}
          subtext="Oldest waiting 2 days"
          dotColor="#b197fc"
          onClick={onReviewSubmissions}
        />
        <MetricDotCard
          label="ACTIVE BLOCKERS"
          value={activeBlockersCount}
          subtext="2 need owner action"
          dotColor="#ffd43b"
          onClick={onNavigateToRisk}
        />
        <MetricDotCard
          label="TEAM CAPACITY"
          value={`${capacityPercent}%`}
          subtext={`Balanced across ${totalMembersCount} members`}
          dotColor="#63e6be"
        />
        <MetricDotCard
          label="AGING WIP"
          value={agingWipCount}
          subtext="Past complexity threshold"
          dotColor="#ff8787"
          onClick={onNavigateToRisk}
        />
      </SimpleGrid>
    </Box>
  );
}