import { Button, Group, SimpleGrid, Text } from "@mantine/core";
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
}

export function PeopleGrid({
  people,
  memberSummaries,
  availability,
  date,
  onPerson,
  onRecordLeave,
}: PeopleGridProps) {
  return (
    <>
      <Group justify="space-between">
        <Text>{people.length} people</Text>
        <Button onClick={onRecordLeave}>Record leave</Button>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }}>
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
    </>
  );
}
