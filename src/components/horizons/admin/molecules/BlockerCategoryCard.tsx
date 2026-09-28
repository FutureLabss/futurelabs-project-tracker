import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconClock,
  IconCpu,
  IconExternalLink,
  IconFileText,
  IconGitBranch,
  IconKey,
} from "@tabler/icons-react";

interface BlockerCategoryCardProps {
  category: string;
  label: string;
  activeCount: number;
  avgResolutionDays: number;
  isSelected: boolean;
  onToggle: (category: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "access":
      return <IconKey size={18} />;
    case "dependency":
      return <IconGitBranch size={18} />;
    case "scope":
    case "unclear_requirement":
      return <IconFileText size={18} />;
    case "external":
      return <IconExternalLink size={18} />;
    case "technical":
      return <IconCpu size={18} />;
    default:
      return <IconAlertTriangle size={18} />;
  }
};

export function BlockerCategoryCard({
  category,
  label,
  activeCount,
  avgResolutionDays,
  isSelected,
  onToggle,
}: BlockerCategoryCardProps) {
  const hasActive = activeCount > 0;

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{
        borderColor: isSelected
          ? "var(--mantine-color-teal-filled)"
          : undefined,
        backgroundColor: isSelected
          ? "var(--mantine-color-teal-light)"
          : undefined,
        transition: "border-color 0.15s ease, background-color 0.15s ease",
      }}
    >
      <Stack justify="space-between" style={{ height: "100%" }} gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon
              size="md"
              radius="md"
              variant="light"
              color={hasActive ? "red" : "gray"}
            >
              {getCategoryIcon(category)}
            </ThemeIcon>
            <Box>
              <Text fw={600} size="sm">
                {label}
              </Text>
              <Group gap={4} mt={2} c="dimmed">
                <IconClock size={12} />
                <Text size="xs">
                  Avg. resolution: {avgResolutionDays.toFixed(1)}d
                </Text>
              </Group>
            </Box>
          </Group>

          <Badge
            variant={hasActive ? "filled" : "light"}
            color={hasActive ? "red" : "gray"}
            size="sm"
          >
            {activeCount} active
          </Badge>
        </Group>

        <Button
          size="xs"
          variant={isSelected ? "filled" : "light"}
          color={isSelected ? "teal" : "gray"}
          onClick={() => onToggle(category)}
          fullWidth
          mt="xs"
        >
          {isSelected ? "Filtering by this category" : "Filter this category"}
        </Button>
      </Stack>
    </Card>
  );
}
