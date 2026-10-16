import { Card, Group, Progress, Table, Text, Title } from "@mantine/core";
import { IconChartLine } from "@tabler/icons-react";
import type { MonthlyDeliveryRow } from "../../../../domain/calculations/admin-insights";

/** FR-56 / FR-59: accepted work and rework, month by month. */
export function MonthlyTrendCard({ rows }: { rows: MonthlyDeliveryRow[] }) {
  const maxWeight = Math.max(1, ...rows.map((r) => r.acceptedWeight));

  return (
    <Card withBorder radius="md" p="md">
      <Group gap="xs" mb={4}>
        <IconChartLine size={20} color="var(--mantine-color-teal-filled)" />
        <Title order={4} size="h5">
          Monthly trend
        </Title>
      </Group>
      <Text size="xs" c="dimmed" mb="sm">
        Last {rows.length} months, by when it happened. Work accepted and later reopened still counts in the month it
        was accepted.
      </Text>
      <Table.ScrollContainer minWidth={560}>
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Month</Table.Th>
              <Table.Th>Accepted</Table.Th>
              <Table.Th style={{ width: "32%" }}>Accepted points</Table.Th>
              <Table.Th>Submitted</Table.Th>
              <Table.Th>Returned or reopened</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.month}>
                <Table.Td>
                  <Text size="sm" fw={600}>
                    {row.label}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{row.acceptedCount}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Progress value={(row.acceptedWeight / maxWeight) * 100} color="teal" size="sm" style={{ flex: 1 }} />
                    <Text size="sm" w={48} ta="right">
                      {row.acceptedWeight} pts
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{row.submissions}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c={row.reworkPercent && row.reworkPercent > 0 ? "orange.7" : undefined}>
                    {row.reworkPercent === null ? "—" : `${row.reworked} (${row.reworkPercent}%)`}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}
