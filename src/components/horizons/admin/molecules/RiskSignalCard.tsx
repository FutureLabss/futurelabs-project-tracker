import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { SeverityBadge } from "../atoms/SeverityBadge";
import type { AttentionItem } from "../../../../entities/operational-signals.entity";

interface RiskSignalCardProps {
  risk: AttentionItem;
  onInvestigate: (id: string, type: "task" | "project") => void;
}

export function RiskSignalCard({ risk, onInvestigate }: RiskSignalCardProps) {
  return (
    <Card withBorder>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Group>
            <SeverityBadge severity={risk.severity} />
            <Text fw={600}>{risk.headline}</Text>
          </Group>
          <Text size="sm">{risk.details}</Text>
          <Text size="xs" c="dimmed">
            {risk.projectName} · {risk.assigneeName}
          </Text>
        </Stack>
        <Button
          variant="light"
          size="xs"
          onClick={() => {
            if (risk.taskId) onInvestigate(risk.taskId, "task");
            else if (risk.projectId) onInvestigate(risk.projectId, "project");
          }}
        >
          Investigate
        </Button>
      </Group>
    </Card>
  );
}
