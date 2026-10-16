import { Badge } from "@mantine/core";

export function ComplexityBadge({ complexity }: { complexity: string }) {
  const normalized = complexity.toUpperCase();
  const isLow = normalized.includes("LOW");
  const isMid = normalized.includes("MID");

  return (
    <Badge
      variant="outline"
      color={isLow ? "teal" : isMid ? "blue" : "orange"}
      radius="xs"
      size="sm"
      styles={{
        root: { borderColor: isLow ? "#38d9a9" : undefined, fontWeight: 700 },
      }}
    >
      {complexity}
    </Badge>
  );
}
