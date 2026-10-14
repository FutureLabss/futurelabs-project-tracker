import { Badge } from "@mantine/core";
import { readable } from "../admin-utils";

interface TaskStatusBadgeProps {
  status: string;
}

const colorMap: Record<string, string> = {
  blocked: "red",
  accepted: "teal",
  cancelled: "gray",
  submitted: "violet",
  not_started: "gray",
  in_progress: "blue",
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return <Badge color={colorMap[status] ?? "blue"}>{readable(status)}</Badge>;
}
