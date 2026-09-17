import { Button, Card, Text } from "@mantine/core";

interface BlockerCategoryCardProps {
  category: string;
  label: string;
  activeCount: number;
  avgResolutionDays: number;
  isSelected: boolean;
  onToggle: (category: string) => void;
}

export function BlockerCategoryCard({
  category,
  label,
  activeCount,
  avgResolutionDays,
  isSelected,
  onToggle,
}: BlockerCategoryCardProps) {
  return (
    <Card withBorder>
      <Text fw={600}>{label}</Text>
      <Text size="sm">
        {activeCount} active · Average resolution{" "}
        {avgResolutionDays.toFixed(1)} working days
      </Text>
      <Button
        mt="sm"
        variant={isSelected ? "filled" : "light"}
        onClick={() => onToggle(category)}
      >
        Inspect category
      </Button>
    </Card>
  );
}
