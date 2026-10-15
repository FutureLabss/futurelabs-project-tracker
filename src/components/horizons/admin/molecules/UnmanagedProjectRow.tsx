import { Badge, Button, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconUserPlus } from "@tabler/icons-react";
import { ProjectLink } from "../atoms/ProjectLink";
import type { Project } from "../../../../entities/project.entity";

interface UnmanagedProjectRowProps {
  project: Project;
  onProject: (id: string) => void;
  onAssignLead: (projectId: string) => void;
}

export function UnmanagedProjectRow({
  project,
  onProject,
  onAssignLead,
}: UnmanagedProjectRowProps) {
  return (
    <Paper
      withBorder
      p="xs"
      radius="sm"
      style={{
        transition: "border-color 0.15s ease",
        borderColor: "var(--mantine-color-orange-3)",
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon size="sm" color="orange" variant="light" radius="xl">
            <IconAlertTriangle size={12} />
          </ThemeIcon>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              <ProjectLink
                name={project.name}
                onClick={() => onProject(project.id)}
              />
              {project.targetDate && (
                <Badge size="xs" variant="outline" color="gray">
                  Due {project.targetDate}
                </Badge>
              )}
            </Group>
            {project.goal && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {project.goal}
              </Text>
            )}
          </Stack>
        </Group>

        <Button
          size="xs"
          variant="light"
          color="orange"
          leftSection={<IconUserPlus size={13} />}
          onClick={() => onAssignLead(project.id)}
          style={{ flexShrink: 0 }}
        >
          Assign lead
        </Button>
      </Group>
    </Paper>
  );
}
