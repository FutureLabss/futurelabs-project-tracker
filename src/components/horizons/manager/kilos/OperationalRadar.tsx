import { Paper, Group, Text, Badge, SimpleGrid, Stack } from "@mantine/core";
import { IconFlame, IconAlertTriangle } from "@tabler/icons-react";
import type { RiskSignal } from "../../../../types/dashboard";
import { RiskSignalCard } from "../delta/RiskSignalCard";

export type AttentionRadarItem = RiskSignal;

interface OperationalRadarProps {
  items: AttentionRadarItem[];
  onInspect: (item: AttentionRadarItem) => void;
}

export function OperationalRadar({ items, onInspect }: OperationalRadarProps) {
  // FR-32: only overdue-and-stale work (silent overruns) is pinned above everything else.
  const criticalItems = items.filter((item) => item.signalType === "silent_overrun");
  const warningItems = items.filter((item) => item.signalType !== "silent_overrun");

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <IconAlertTriangle size={20} color="#20c997" />
          <Text size="md" fw={700} c="dark.9">
            Operational Attention Radar ({items.length})
          </Text>
          {criticalItems.length > 0 && (
            <Badge
              color="red"
              variant="filled"
              size="xs"
              leftSection={<IconFlame size={10} />}
            >
              {criticalItems.length} SILENT OVERRUN(S) PINNED
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          Every item opens its task • Silent overruns first
        </Text>
      </Group>

      <Stack gap="md">
        {criticalItems.length > 0 && (
          <Stack gap="xs">
            <Group gap={4}>
              <IconFlame size={14} color="#fa5252" />
              <Text size="xs" fw={700} c="red.7" tt="uppercase" lts={0.5}>
                Pinned Critical Exceptions (Overdue + Stale Activity)
              </Text>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {criticalItems.map((risk) => (
                <RiskSignalCard
                  key={risk.id}
                  risk={risk}
                  onInspect={onInspect}
                />
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {warningItems.length > 0 && (
          <Stack gap="xs">
            <Group gap={4}>
              <IconAlertTriangle size={14} color="#f59f00" />
              <Text size="xs" fw={700} c="yellow.8" tt="uppercase" lts={0.5}>
                Everything else needing attention
              </Text>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {warningItems.map((risk) => (
                <RiskSignalCard
                  key={risk.id}
                  risk={risk}
                  onInspect={onInspect}
                />
              ))}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
