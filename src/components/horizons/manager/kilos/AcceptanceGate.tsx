import { Paper, Group, Text, Badge, Button, Box } from "@mantine/core";
import { IconClipboardCheck, IconPlayerPlay } from "@tabler/icons-react";
import type { TaskComplexity } from "../../../../entities/task.entity";
import { ReusableTable, type ColumnDef } from "../../../Table/ReusableTab";
import { ComplexityBadge } from "../alpha/ComplexityBadge";

export interface DeliverableRow {
  id: string;
  title: string;
  description?: string;
  projectName: string;
  submittedByName: string;
  complexity: TaskComplexity;
  rawTask: unknown;
}

interface AcceptanceGateProps {
  deliverables: DeliverableRow[];
  onReviewDeliverable: (deliverable: DeliverableRow) => void;
  loading?: boolean;
}

export function AcceptanceGate({
  deliverables,
  onReviewDeliverable,
  loading,
}: AcceptanceGateProps) {
  const columns: ColumnDef<DeliverableRow>[] = [
    {
      header: "Deliverable",
      render: (d) => (
        <Box>
          <Text size="sm" fw={700} c="dark.8">
            {d.title}
          </Text>
          <Text size="xs" c="dimmed">
            {d.description ||
              "Client-side permission router gates matching backend permission claims."}
          </Text>
        </Box>
      ),
    },
    {
      header: "Project",
      render: (d) => (
        <Text size="sm" c="dark.6">
          {d.projectName}
        </Text>
      ),
    },
    {
      header: "Submitted By",
      render: (d) => (
        <Text size="sm" c="blue.7" fw={600}>
          {d.submittedByName}
        </Text>
      ),
    },
    {
      header: "Complexity",
      render: (d) => <ComplexityBadge complexity={d.complexity} />,
    },
    {
      header: "Action",
      render: (d) => (
        <Button
          variant="light"
          color="violet"
          size="xs"
          leftSection={<IconPlayerPlay size={12} />}
          onClick={() => onReviewDeliverable(d)}
        >
          Review Deliverable
        </Button>
      ),
    },
  ];

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconClipboardCheck size={20} color="#7950f2" />
          <Text size="md" fw={700} c="dark.9">
            Manager Acceptance Gate ({deliverables.length})
          </Text>
          <Badge color="violet" variant="light" size="xs">
            AWAITING VERIFICATION
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          Formal sign-off / rework gate
        </Text>
      </Group>

      <ReusableTable columns={columns} data={deliverables} loading={loading} />
    </Paper>
  );
}
