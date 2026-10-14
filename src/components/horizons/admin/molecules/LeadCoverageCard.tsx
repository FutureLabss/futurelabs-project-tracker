import { Button, Card, Group, Progress, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconShieldCheck, IconArrowRight, IconUserCheck } from "@tabler/icons-react";

interface LeadCoverageCardProps {
  activeProjectsCount: number;
  managedProjectsCount: number;
  onManageProjects: () => void;
}

export function LeadCoverageCard({
  activeProjectsCount,
  managedProjectsCount,
  onManageProjects,
}: LeadCoverageCardProps) {
  const coveragePercent = activeProjectsCount
    ? Math.round((managedProjectsCount / activeProjectsCount) * 100)
    : 0;

  const isFullCoverage = coveragePercent === 100;

  return (
    <Card
      withBorder
      p="lg"
      radius="md"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "var(--mantine-color-body)",
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <ThemeIcon
              size="md"
              radius="md"
              variant="light"
              color={isFullCoverage ? "teal" : "blue"}
            >
              {isFullCoverage ? (
                <IconShieldCheck size={18} />
              ) : (
                <IconUserCheck size={18} />
              )}
            </ThemeIcon>
            <Text fw={600} size="sm">
              Lead coverage
            </Text>
          </Group>
          <Text
            fw={700}
            size="lg"
            c={isFullCoverage ? "teal" : coveragePercent < 70 ? "orange" : "blue"}
          >
            {coveragePercent}%
          </Text>
        </Group>

        <Text size="xs" c="dimmed">
          {managedProjectsCount} of {activeProjectsCount} active projects have a
          designated lead.
        </Text>

        <Progress
          value={coveragePercent}
          color={isFullCoverage ? "teal" : coveragePercent < 70 ? "orange" : "blue"}
          size="sm"
          radius="xl"
          mt={4}
        />
      </Stack>

      <Button
        mt="md"
        variant="light"
        color="teal"
        size="xs"
        rightSection={<IconArrowRight size={14} />}
        onClick={onManageProjects}
      >
        Manage projects and access
      </Button>
    </Card>
  );
}
