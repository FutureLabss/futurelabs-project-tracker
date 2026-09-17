import { Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { PersonLink } from "../atoms/PersonLink";
import { AvailabilityBadge } from "../atoms/AvailabilityBadge";
import type { Person } from "../../../../entities/person.entity";
import type { MemberSignalSummary } from "../../../../entities/operational-signals.entity";

interface PersonCardProps {
  person: Person;
  summary?: MemberSignalSummary;
  onLeave: boolean;
  onViewProfile: (id: string) => void;
}

export function PersonCard({
  person,
  summary,
  onLeave,
  onViewProfile,
}: PersonCardProps) {
  return (
    <Card withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <PersonLink
            name={person.name}
            fw={700}
            onClick={() => onViewProfile(person.id)}
          />
          <Badge>{person.role}</Badge>
        </Group>
        <Text size="sm" c="dimmed">
          {person.title || person.email}
        </Text>
        <Text size="sm">
          {summary?.activeTasksCount ?? 0} open tasks ·{" "}
          {summary?.totalComplexityWeight ?? 0} points ·{" "}
          {summary?.overdueCount ?? 0} overdue
        </Text>
        <AvailabilityBadge status={person.status} onLeave={onLeave} />
        <Button
          variant="light"
          size="xs"
          onClick={() => onViewProfile(person.id)}
        >
          View profile and history
        </Button>
      </Stack>
    </Card>
  );
}
