import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconClipboardCheck, IconPlayerPlay } from '@tabler/icons-react';
import { acceptanceItems, type AcceptanceItem } from '../../../data/mockData';
import { ReusableTable, type TableColumn } from '../../Table/ReusableTable';

type ManagerAcceptanceGateProps = {
  items?: AcceptanceItem[];
  onReview?: (item: AcceptanceItem) => void;
};

export default function ManagerAcceptanceGate({
  items = acceptanceItems,
  onReview,
}: ManagerAcceptanceGateProps) {
  const columns: TableColumn<AcceptanceItem>[] = [
    {
      key: 'deliverable',
      label: 'Deliverable',
      width: '36%',
      render: (item) => (
        <Stack gap={2}>
          <Text size="sm" fw={700} c="dark.9">
            {item.deliverable}
          </Text>
          <Text size="xs" c="dimmed">
            {item.description}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'project',
      label: 'Project',
      width: '24%',
      render: (item) => (
        <Text size="sm" c="dark.8">
          {item.project}
        </Text>
      ),
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      width: '16%',
      render: (item) => (
        <Text
          size="sm"
          fw={600}
          c="blue.6"
          style={{ cursor: 'pointer' }}
          onClick={() => onReview?.(item)}
        >
          {item.submittedBy}
        </Text>
      ),
    },
    {
      key: 'complexity',
      label: 'Complexity',
      width: '12%',
      render: (item) => (
        <Badge variant="outline" color="teal" radius="sm" size="sm" fw={700}>
          {item.complexity} ({item.points} {item.points === 1 ? 'PT' : 'PTS'})
        </Badge>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      width: '12%',
      render: (item) => (
        <Group justify="flex-end">
          <Button
            variant="light"
            color="grape"
            radius="md"
            size="xs"
            leftSection={<IconPlayerPlay size={14} />}
            onClick={() => onReview?.(item)}
          >
            Review Deliverable
          </Button>
        </Group>
      ),
    },
  ];

  return (
    <Card withBorder radius="md" p="xl" bg="white">
      <Group justify="space-between" align="center" mb="md">
        <Group gap="sm">
          <ThemeIcon variant="transparent" c="grape.6" size="sm">
            <IconClipboardCheck size={24} />
          </ThemeIcon>
          <Title order={3} fz="lg" fw={700}>
            Manager Acceptance Gate ({items.length})
          </Title>
          <Badge color="grape" variant="light" radius="sm" size="xs" fw={700}>
            AWAITING VERIFICATION
          </Badge>
        </Group>

        <Text fz="xs" c="dimmed">
          Formal sign-off / rework gate
        </Text>
      </Group>

      <Box mt="md">
        <ReusableTable
          columns={columns}
          data={items}
          emptyMessage="No deliverables awaiting verification"
        />
      </Box>
    </Card>
  );
}