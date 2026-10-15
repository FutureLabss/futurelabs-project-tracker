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
  /** FR-60: blockers of this category raised in the chosen period, and the projects they hit. */
  raisedInPeriod: number;
  projectNames: string[];
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
  raisedInPeriod,
  projectNames,
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
            {activeCount} open now
          </Badge>
        </Group>

        <Box>
          <Text size="sm">
            <Text span fw={700}>{raisedInPeriod}</Text> raised in this period
          </Text>
          <Text size="xs" c="dimmed" lineClamp={3}>
            {projectNames.length ? `Projects: ${projectNames.join(", ")}` : "No projects affected in this period"}
          </Text>
        </Box>

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
