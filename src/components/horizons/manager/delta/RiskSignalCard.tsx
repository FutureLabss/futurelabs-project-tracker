// src/components/dashboard/molecules/RiskSignalCard.tsx
import { Paper, Group, Text, Badge, Button, Box, Stack } from "@mantine/core";
import { IconAlertTriangle, IconFlame } from "@tabler/icons-react";
import type { AttentionRadarItem } from "../../../horizons/manager/kilos/OperationalRadar";

interface RiskSignalCardProps {
  risk: AttentionRadarItem;
  onInspect: (risk: AttentionRadarItem) => void;
}

export function RiskSignalCard({ risk, onInspect }: RiskSignalCardProps) {
  const isCritical = risk.severity === "critical";

  return (
    <Paper
      withBorder
      p="md"
      radius="sm"
      style={{
        borderColor: isCritical ? "#ffa8a8" : "#ffe066",
        backgroundColor: isCritical ? "#fff5f5" : "#fff9db",
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Badge
              color={
                isCritical
                  ? "red"
                  : risk.signalType === "returned_for_rework"
                    ? "orange"
                    : "yellow"
              }
              variant="filled"
              size="xs"
              leftSection={
                isCritical ? (
                  <IconFlame size={12} />
                ) : (
                  <IconAlertTriangle size={12} />
                )
              }
            >
              {isCritical
                ? "CRITICAL: SILENT OVERRUN"
                : risk.signalType === "returned_for_rework"
                  ? "RETURNED FOR WORK"
                  : "WARNING"}
            </Badge>
            <Text size="xs" c="dimmed" fw={500}>
              {risk.projectName}
            </Text>
          </Group>
          <Badge variant="outline" color="gray" size="xs">
            ASSIGNEE: {risk.assigneeName.toUpperCase()}
          </Badge>
        </Group>

        <Box>
          <Text size="sm" fw={700} c="dark.9">
            {risk.headline}
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            {risk.details}
          </Text>
        </Box>

        <Group justify="flex-end" mt={4}>
          <Button
            variant="subtle"
            color={isCritical ? "red" : "yellow"}
            size="compact-xs"
            onClick={() => onInspect(risk)} // Triggers modal opening
          >
            {isCritical ? "Inspect Silent Overrun" : "Inspect Item"}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
