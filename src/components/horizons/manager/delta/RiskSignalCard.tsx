// src/components/dashboard/molecules/RiskSignalCard.tsx
import { Paper, Group, Text, Badge, Button, Box, Stack } from "@mantine/core";
import { IconAlertTriangle, IconFlame } from "@tabler/icons-react";
import type { AttentionRadarItem } from "../../../horizons/manager/kilos/OperationalRadar";

const SIGNAL_LABELS: Record<AttentionRadarItem["signalType"], string> = {
  silent_overrun: "SILENT OVERRUN",
  aging_blocker: "AGING BLOCKER",
  blocked: "BLOCKED",
  returned_for_rework: "RETURNED FOR WORK",
  aging_wip: "IN PROGRESS TOO LONG",
  stale_inactivity: "NO RECENT ACTIVITY",
  overdue: "OVERDUE",
  imminent_unstarted: "NOT STARTED, DUE SOON",
  unowned_task: "UNASSIGNED",
  unmanaged_project: "NO MANAGER",
};

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
              {isCritical ? `CRITICAL: ${SIGNAL_LABELS[risk.signalType]}` : SIGNAL_LABELS[risk.signalType]}
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
            Inspect task
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
