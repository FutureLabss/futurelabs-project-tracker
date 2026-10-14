import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowRight,
  IconFolder,
  IconInfoCircle,
  IconUser,
} from "@tabler/icons-react";
import { SeverityBadge } from "../atoms/SeverityBadge";
import type { AttentionItem } from "../../../../entities/operational-signals.entity";

interface RiskSignalCardProps {
  risk: AttentionItem;
  onInvestigate: (id: string, type: "task" | "project") => void;
}

export function RiskSignalCard({ risk, onInvestigate }: RiskSignalCardProps) {
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      default:
        return "blue";
    }
  };

  const color = getSeverityColor(risk.severity);

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case "critical":
        return <IconAlertOctagon size={16} />;
      case "high":
        return <IconAlertTriangle size={16} />;
      case "medium":
        return <IconAlertCircle size={16} />;
      default:
        return <IconInfoCircle size={16} />;
    }
  };

  return (
    <Card
      withBorder
      p="sm"
      radius="md"
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: `var(--mantine-color-${color}-6)`,
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
        background: "var(--mantine-color-body)",
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="sm" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon
            size="md"
            radius="md"
            variant="light"
            color={color}
            style={{ flexShrink: 0, marginTop: 2 }}
          >
            {getSeverityIcon(risk.severity)}
          </ThemeIcon>

          <Stack gap={4} style={{ minWidth: 0 }}>
            <Group gap="xs" wrap="wrap">
              <SeverityBadge severity={risk.severity} />
              <Text fw={600} size="sm">
                {risk.headline}
              </Text>
            </Group>

            <Text size="xs" c="dimmed" lineClamp={2}>
              {risk.details}
            </Text>

            <Group gap="xs" mt={2} wrap="wrap">
              {risk.projectName && (
                <Badge
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconFolder size={11} />}
                >
                  {risk.projectName}
                </Badge>
              )}
              {risk.assigneeName && (
                <Badge
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconUser size={11} />}
                >
                  {risk.assigneeName}
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>

        <Button
          variant="light"
          color={color}
          size="xs"
          rightSection={<IconArrowRight size={13} />}
          onClick={() => {
            if (risk.taskId) onInvestigate(risk.taskId, "task");
            else if (risk.projectId) onInvestigate(risk.projectId, "project");
          }}
          style={{ flexShrink: 0, marginLeft: 8 }}
        >
          Investigate
        </Button>
      </Group>
    </Card>
  );
}
