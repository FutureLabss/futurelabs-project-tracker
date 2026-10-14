import {
  Badge,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import {
  IconCalendarOff,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { PersonCard } from "../molecules/PersonCard";
import { EmptyState } from "../atoms/EmptyState";
import type { Person } from "../../../../entities/person.entity";
import type { Availability } from "../../../../entities/availability.entity";
import type { MemberSignalSummary } from "../../../../entities/operational-signals.entity";

interface PeopleGridProps {
  people: Person[];
  memberSummaries: Record<string, MemberSignalSummary>;
  availability: Availability[];
  date: string;
  onPerson: (id: string) => void;
  onRecordLeave: () => void;
  onAddPerson?: () => void;
}

export function PeopleGrid({
  people,
  memberSummaries,
  availability,
  date,
  onPerson,
  onRecordLeave,
  onAddPerson,
}: PeopleGridProps) {
  const onLeaveCount = people.filter((p) =>
    availability.some(
      (a) => a.personId === p.id && a.fromDate <= date && a.toDate >= date,
    ),
  ).length;

  const activeCount = people.filter((p) => p.status === "active").length;

  return (
    <Stack gap="md">
      {/* Lean Team Header Toolbar */}
      <Card withBorder p="sm" radius="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="xs" wrap="wrap">
            <Badge
              size="lg"
              variant="light"
              color="teal"
              leftSection={<IconUsers size={14} />}
            >
              {people.length} Team members
            </Badge>
            <Badge size="sm" variant="outline" color="blue" leftSection={<IconUserCheck size={12} />}>
              {activeCount} active
            </Badge>
            {onLeaveCount > 0 && (
              <Badge
                size="sm"
                variant="outline"
                color="orange"
                leftSection={<IconCalendarOff size={12} />}
              >
                {onLeaveCount} on leave
              </Badge>
            )}
          </Group>

          <Group gap="xs">
            {onAddPerson && (
              <Button
                color="teal"
                size="xs"
                leftSection={<IconUserPlus size={15} />}
                onClick={onAddPerson}
              >
                Add team member
              </Button>
            )}
            <Button
              variant="default"
              size="xs"
              leftSection={<IconCalendarOff size={15} />}
              onClick={onRecordLeave}
            >
              Record leave
            </Button>
          </Group>
        </Group>
      </Card>

      {/* People Grid */}
      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
        {people.map((p) => {
          const leave = availability.filter(
            (a) =>
              a.personId === p.id && a.fromDate <= date && a.toDate >= date,
          );
          return (
            <PersonCard
              key={p.id}
              person={p}
              summary={memberSummaries[p.id]}
              onLeave={leave.length > 0}
              onViewProfile={onPerson}
            />
          );
        })}
      </SimpleGrid>

      {!people.length && (
        <EmptyState message="No people match your search." />
      )}
    </Stack>
  );
}
