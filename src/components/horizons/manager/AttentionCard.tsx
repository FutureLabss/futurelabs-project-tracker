import {
  Badge,
  Button,
  Card,
  Group,
  Text,
  Title,
} from '@mantine/core';
import { IconFlame, IconInfoCircle } from '@tabler/icons-react';
import type { AttentionItem } from '../../../data/mockData';

type AttentionCardProps = {
  item: AttentionItem;
  onInspect?: (item: AttentionItem) => void;
};

export default function AttentionCard({ item, onInspect }: AttentionCardProps) {
  const isCritical = item.type === 'critical';

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      bg="white"
      style={
        isCritical
          ? { borderColor: 'var(--mantine-color-red-5)' }
          : undefined
      }
    >
      <Group justify="space-between" mb="xs">
        <Group gap="sm">
          {isCritical ? (
            <Badge
              color="red"
              variant="filled"
              radius="sm"
              size="sm"
              leftSection={<IconFlame size={12} />}
            >
              CRITICAL: SILENT OVERRUN
            </Badge>
          ) : (
            <Badge
              color="yellow.7"
              variant="filled"
              radius="sm"
              size="sm"
              leftSection={<IconInfoCircle size={12} />}
            >
              WARNING
            </Badge>
          )}

          <Text fz="sm" fw={500} c="dimmed">
            {item.project}
          </Text>
        </Group>

        <Badge variant="outline" color="gray" radius="sm" size="sm" tt="uppercase">
          ASSIGNEE: {item.assignee}
        </Badge>
      </Group>

      {isCritical ? (
        <Title order={4} fz="md" fw={700} c="red.7" mt="xs">
          {item.title}
        </Title>
      ) : (
        <Text fz="sm" fw={700} c="dark.9" mt="xs">
          {item.title}
        </Text>
      )}

      <Text fz="xs" c="dimmed" mt={4} lh={1.4}>
        {item.description}
      </Text>

      <Group justify="flex-end" mt="md">
        <Button
          variant="light"
          color={isCritical ? 'red' : 'yellow.8'}
          radius="md"
          size={isCritical ? 'sm' : 'xs'}
          onClick={() => onInspect?.(item)}
        >
          {item.actionLabel}
        </Button>
      </Group>
    </Card>
  );
}