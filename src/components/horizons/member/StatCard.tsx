import {
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';

import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  color: string;
};

export function StatCard({
  title,
  value,
  description,
  icon,
  color,
}: StatCardProps) {
  return (
    <Card
      withBorder
      radius="md"
      padding="md"
      style={{
        minHeight: 98,
      }}
    >
      <Group
        justify="space-between"
        align="flex-start"
      >
        <Stack gap={4}>
          <Text
            size="xs"
            c="dimmed"
            fw={600}
            tt="uppercase"
          >
            {title}
          </Text>

          <Text
            size="xl"
            fw={700}
            lh={1.1}
          >
            {value}
          </Text>

          <Text
            size="xs"
            c="dimmed"
          >
            {description}
          </Text>
        </Stack>

        <ThemeIcon
          size={34}
          radius="sm"
          variant="light"
          color={color}
        >
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}