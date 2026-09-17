import { Button, Card, Progress, Text, Title } from "@mantine/core";

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
    ? (managedProjectsCount / activeProjectsCount) * 100
    : 0;

  return (
    <Card withBorder>
      <Title order={2} size="h4">
        Lead coverage
      </Title>
      <Text mt="sm">
        {managedProjectsCount} of {activeProjectsCount} active projects have a
        designated lead.
      </Text>
      <Progress mt="md" value={coveragePercent} color="teal" />
      <Button mt="md" variant="light" onClick={onManageProjects}>
        Manage projects and access
      </Button>
    </Card>
  );
}
