import { Badge, Button, Group, Text, Title } from "@mantine/core";
import { IconDownload, IconPlus, IconRefresh } from "@tabler/icons-react";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  date: string;
  isFetching: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onNewProject: () => void;
}

export function AdminPageHeader({
  title,
  subtitle,
  date,
  isFetching,
  onRefresh,
  onExport,
  onNewProject,
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
