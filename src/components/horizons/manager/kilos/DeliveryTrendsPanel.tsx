import { useState } from "react";
import { Group, Paper, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { IconChartPie } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { LedgerRecord } from "../../../../entities/ledger-record.entity";
import type { Task } from "../../../../entities/task.entity";
import {
  reworkShare,
  unplannedShare,
  type ShareResult,
} from "../../../../domain/calculations/manager-insights";

interface DeliveryTrendsPanelProps {
  tasks: Task[];
  ledger: LedgerRecord[];
  date: string;
}

function ShareCard({ title, result, detail, empty }: { title: string; result: ShareResult; detail: string; empty: string }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase">{title}</Text>
      <Text size="xl" fw={800} mt={4}>{result.percent === null ? "—" : `${result.percent}%`}</Text>
      <Text size="xs" c="dimmed">{result.percent === null ? empty : detail}</Text>
    </Paper>
  );
}

/** FR-41 / FR-44: unplanned share and rework rate for a period the manager chooses. */
export function DeliveryTrendsPanel({ tasks, ledger, date }: DeliveryTrendsPanelProps) {
  const [from, setFrom] = useState(dayjs(date).subtract(30, "day").format("YYYY-MM-DD"));
  const [to, setTo] = useState(date);

  const unplanned = unplannedShare(tasks, from, to);
  const rework = reworkShare(ledger, new Set(tasks.map((t) => t.id)), from, to);

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Group justify="space-between" align="flex-end" mb="md" wrap="wrap">
        <Group gap="xs">
          <IconChartPie size={20} color="#20c997" />
          <Stack gap={0}>
            <Text size="md" fw={700}>Delivery Trends</Text>
            <Text size="xs" c="dimmed">Across your projects, for the period you choose</Text>
          </Stack>
        </Group>
        <Group gap="xs">
          <TextInput type="date" size="xs" label="From" value={from} max={to} onChange={(e) => setFrom(e.currentTarget.value)} />
          <TextInput type="date" size="xs" label="To" value={to} min={from} onChange={(e) => setTo(e.currentTarget.value)} />
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <ShareCard
          title="Unplanned work"
          result={unplanned}
          detail={`${unplanned.part} of ${unplanned.total} pts created in the period (${unplanned.count.part} of ${unplanned.count.total} tasks) were self-assigned`}
          empty="No work was created in this period"
        />
        <ShareCard
          title="Returned or reopened"
          result={rework}
          detail={`${rework.part} of ${rework.total} tasks submitted in the period were returned or reopened`}
          empty="No work was submitted in this period"
        />
      </SimpleGrid>
    </Paper>
  );
}
