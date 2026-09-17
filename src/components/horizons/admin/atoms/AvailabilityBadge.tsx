import { Badge } from "@mantine/core";

interface AvailabilityBadgeProps {
  status: string | null | undefined;
  onLeave: boolean;
}

export function AvailabilityBadge({ status, onLeave }: AvailabilityBadgeProps) {
  const isInactive = status === "inactive";

  const color = isInactive ? "gray" : onLeave ? "orange" : "teal";
  const label = isInactive ? "Inactive" : onLeave ? "On leave" : "Available";

  return <Badge color={color}>{label}</Badge>;
}
