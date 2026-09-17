import { Anchor, Card, Stack, Text } from "@mantine/core";

interface MetricCardProps {
  label: string;
  value: string | number;
  detail: string;
  onClick?: () => void;
}

export function MetricCard({ label, value, detail, onClick }: MetricCardProps) {
  return (
    <Card withBorder radius="md" key={label}>
      <Stack gap={6}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {label}
        </Text>
        {onClick ? (
          <Anchor
            component="button"
            ta="left"
            fz={30}
            fw={750}
            onClick={onClick}
          >
            {value}
          </Anchor>
        ) : (
          <Text fz={30} fw={750}>
            {value}
          </Text>
        )}
        <Text size="sm" c="dimmed">
          {detail}
        </Text>
      </Stack>
    </Card>
  );
}
