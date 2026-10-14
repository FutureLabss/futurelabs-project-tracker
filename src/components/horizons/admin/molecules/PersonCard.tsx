import {
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconChecklist,
  IconWeight,
} from "@tabler/icons-react";
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
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "violet";
      case "manager":
        return "blue";
      default:
        return "teal";
    }
  };

  const roleColor = getRoleColor(person.role);
  const initials = person.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const overdueCount = summary?.overdueCount ?? 0;

  return (
    <Card
      withBorder
      p="md"
      radius="md"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
        background: "var(--mantine-color-body)",
      }}
    >
      <Stack gap="sm">
        {/* Top identity block */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <Avatar
              radius="xl"
              size="md"
              color={roleColor}
              variant="light"
              style={{ fontWeight: 700, flexShrink: 0 }}
            >
              {initials}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <PersonLink
                name={person.name}
                fw={700}
                onClick={() => onViewProfile(person.id)}
              />
              <Text size="xs" c="dimmed" lineClamp={1}>
                {person.title || person.email}
              </Text>
            </div>
          </Group>

          <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
            <Badge size="xs" variant="light" color={roleColor}>
              {person.role}
            </Badge>
            <AvailabilityBadge status={person.status} onLeave={onLeave} />
          </Stack>
        </Group>

        {/* Workload Metric Chips */}
        <SimpleGrid cols={3} spacing={6} mt={4}>
          <Card
            withBorder
            p={6}
            radius="sm"
            style={{ textAlign: "center", background: "var(--mantine-color-default-hover)" }}
          >
            <Group justify="center" gap={4}>
              <ThemeIcon size={14} variant="transparent" c="dimmed">
                <IconChecklist size={12} />
              </ThemeIcon>
              <Text fw={700} size="xs">
                {summary?.activeTasksCount ?? 0}
              </Text>
            </Group>
            <Text size="10px" c="dimmed">
              Tasks
            </Text>
          </Card>

          <Card
            withBorder
            p={6}
            radius="sm"
            style={{ textAlign: "center", background: "var(--mantine-color-default-hover)" }}
          >
            <Group justify="center" gap={4}>
              <ThemeIcon size={14} variant="transparent" c="dimmed">
                <IconWeight size={12} />
              </ThemeIcon>
              <Text fw={700} size="xs">
                {summary?.totalComplexityWeight ?? 0}
              </Text>
            </Group>
            <Text size="10px" c="dimmed">
              Points
            </Text>
          </Card>

          <Card
            withBorder
            p={6}
            radius="sm"
            style={{
              textAlign: "center",
              background:
                overdueCount > 0
                  ? "var(--mantine-color-red-light)"
                  : "var(--mantine-color-default-hover)",
              borderColor:
                overdueCount > 0
                  ? "var(--mantine-color-red-3)"
                  : undefined,
            }}
          >
            <Group justify="center" gap={4}>
              <ThemeIcon
                size={14}
                variant="transparent"
                c={overdueCount > 0 ? "red" : "dimmed"}
              >
                <IconAlertTriangle size={12} />
              </ThemeIcon>
              <Text
                fw={700}
                size="xs"
                c={overdueCount > 0 ? "red" : undefined}
              >
                {overdueCount}
              </Text>
            </Group>
            <Text
              size="10px"
              c={overdueCount > 0 ? "red" : "dimmed"}
            >
              Overdue
            </Text>
          </Card>
        </SimpleGrid>
      </Stack>

      <Button
        mt="sm"
        variant="light"
        color="gray"
        size="xs"
        fullWidth
        rightSection={<IconArrowRight size={13} />}
        onClick={() => onViewProfile(person.id)}
      >
        View profile and history
      </Button>
    </Card>
  );
}
