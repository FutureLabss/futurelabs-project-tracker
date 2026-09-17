import { Badge } from "@mantine/core";

type Severity = "critical" | "warning" | "info";

interface SeverityBadgeProps {
  severity: Severity;
}

const colorMap: Record<Severity, string> = {
  critical: "red",
  warning: "orange",
  info: "blue",
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return <Badge color={colorMap[severity]}>{severity}</Badge>;
}
