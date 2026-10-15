import { Badge } from "@mantine/core";
import type { RagStatus } from "../../../../entities/project.entity";

interface RagBadgeProps {
  status: RagStatus | undefined;
  closed?: boolean;
}

const colorMap: Record<RagStatus, string> = {
  red: "red",
  amber: "orange",
  green: "teal",
};

export function RagBadge({ status, closed }: RagBadgeProps) {
  if (closed) {
    return (
      <Badge
        variant="light"
        color="gray"
        radius="xl"
        size="sm"
        leftSection={
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "currentColor",
              display: "inline-block",
            }}
          />
        }
      >
        Closed
      </Badge>
    );
  }

  const color = status ? colorMap[status] : "gray";
  const label = status
    ? status === "green"
      ? "On Track"
      : status === "amber"
        ? "Attention"
        : "At Risk"
    : "Unknown";

  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size="sm"
      leftSection={
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "currentColor",
            display: "inline-block",
          }}
        />
      }
    >
      {label}
    </Badge>
  );
}
