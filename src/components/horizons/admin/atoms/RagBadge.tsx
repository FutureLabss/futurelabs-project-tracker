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
    return <Badge color="gray">Closed</Badge>;
  }
  return (
    <Badge color={status ? colorMap[status] : "gray"}>
      {status ?? "Unknown"}
    </Badge>
  );
}
