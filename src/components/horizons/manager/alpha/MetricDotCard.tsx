import { Card, Text, Title, Group, Box } from '@mantine/core';

interface MetricDotCardProps {
  label: string;
  value: string | number;
  subtext: string;
  dotColor: string;
  onClick?: () => void;
}

export function MetricDotCard({ label, value, subtext, dotColor, onClick }: MetricDotCardProps) {
  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Group justify="space-between" align="center" mb="xs">
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>
          {label}
        </Text>
        <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: dotColor }} />
      </Group>
      <Title order={2} fw={800} fz={32} c="dark.8">
        {value}
      </Title>
      <Text size="xs" c="dimmed" mt={4}>
        {subtext}
      </Text>
    </Card>
  );
}