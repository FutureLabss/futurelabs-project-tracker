import {
  Badge,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { TeamMember } from '../../../data/mockData';

type TeamCapacityProps = {
  members: TeamMember[];
  onSelectMember?: (member: TeamMember) => void;
};

export default function TeamCapacity({
  members,
  onSelectMember,
}: TeamCapacityProps) {
  return (
    <Card withBorder radius="md" p="xl" bg="white">
      {/* Header */}
      <Group justify="space-between" align="center" mb="md">
        <Title order={3} fz="lg" fw={700}>
          Size-Weighted Team Capacity Distribution
        </Title>

        <Text fz="xs" c="dimmed">
          Complexity points sum (Low=1, Mid=2, High=3) • Click any member card
        </Text>
      </Group>

      {/* Team members */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {members.map((member) => (
          <Card
            key={member.id}
            withBorder
            radius="md"
            p="md"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectMember?.(member)}
          >
            {/* Name and points */}
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Text fz="md" fw={700} c="blue.6">
                  {member.name}
                </Text>
                <Text fz="xs" c="dimmed">
                  {member.role}
                </Text>
              </Stack>

              <Group gap="xs">
                {member.onLeave && (
                  <Badge variant="outline" color="blue" radius="sm" size="xs" fw={700}>
                    ON LEAVE
                  </Badge>
                )}
                <Badge
                  color={member.overdue > 0 ? 'orange.8' : 'teal'}
                  variant="filled"
                  radius="sm"
                  size="sm"
                  fw={700}
                >
                  {member.points} PTS
                </Badge>
              </Group>
            </Group>

            {/* Capacity bar */}
            <Progress
              value={member.capacityPercentage}
              color={member.overdue > 0 ? 'orange.7' : 'teal.6'}
              size="sm"
              radius="xl"
              mt="md"
            />

            {/* Bottom information */}
            <Group justify="space-between" mt="sm">
              <Text fz="xs" c="dimmed">
                {member.activeTasks} active task(s)
              </Text>

              {member.overdue > 0 && (
                <Badge color="red" variant="light" radius="sm" size="xs" fw={700}>
                  {member.overdue} OVERDUE
                </Badge>
              )}
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </Card>
  );
}