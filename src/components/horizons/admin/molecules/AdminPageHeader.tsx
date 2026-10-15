import { Badge, Button, Group, Text, Title, Tooltip } from "@mantine/core";
import {
  IconAlertTriangle,
  IconDownload,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  date: string;
  isFetching: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onNewProject: () => void;
  onResetDemo?: () => void;
  canResetDemo?: boolean;
}

export function AdminPageHeader({
  title,
  subtitle,
  date,
  isFetching,
  onRefresh,
  onExport,
  onNewProject,
  onResetDemo,
  canResetDemo = true,
}: AdminPageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" mb="xl">
      <div>
        <Badge color="teal" variant="light">
          Administrator
        </Badge>
        <Title mt="xs" order={1} size="h2">
          {title}
        </Title>
        <Text c="dimmed" mt={4}>
          {subtitle}
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          Reporting date: {date} · Writes are recorded at the current time.
        </Text>
      </div>
      <Group gap="xs">
        {onResetDemo &&
          (canResetDemo ? (
            <Button
              variant="subtle"
              color="red"
              leftSection={<IconAlertTriangle size={16} />}
              onClick={onResetDemo}
            >
              Reset demo
            </Button>
          ) : (
            <Tooltip label="Demo reset is disabled for Supabase cloud to prevent data loss.">
              <Button
                variant="subtle"
                color="gray"
                disabled
                leftSection={<IconAlertTriangle size={16} />}
              >
                Reset demo
              </Button>
            </Tooltip>
          ))}
        <Button
          variant="default"
          leftSection={<IconRefresh size={16} />}
          loading={isFetching}
          onClick={onRefresh}
        >
          Refresh
        </Button>
        <Button
          variant="light"
          leftSection={<IconDownload size={16} />}
          onClick={onExport}
        >
          Export CSV
        </Button>
        <Button
          color="teal"
          leftSection={<IconPlus size={16} />}
          onClick={onNewProject}
        >
          New project
        </Button>
      </Group>
    </Group>
  );
}

