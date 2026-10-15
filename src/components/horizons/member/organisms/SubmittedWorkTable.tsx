import { useState } from 'react';
import { Badge, SegmentedControl, Stack, Text, UnstyledButton } from '@mantine/core';
import dayjs from 'dayjs';

import { useLedger } from '../../../../api/hooks/use-ledger';
import { useProjects } from '../../../../api/hooks/use-projects';
import { useTasks } from '../../../../api/hooks/use-tasks';
import { getWorkingDaysElapsed } from '../../../../domain/calculations/working-days';
import type { LedgerRecord } from '../../../../entities/ledger-record.entity';
import { ReusableTable, type TableColumn } from '../../../Table/ReusableTable';

type Outcome = 'awaiting' | 'returned' | 'accepted';

interface SubmittedRow {
  id: string;
  title: string;
  project: string;
  outcome: Outcome;
  submittedAt: string | null;
  decidedAt: string | null;
  waitingDays: number;
  reason: string | null;
}

interface SubmittedWorkTableProps {
  personId: string;
  date: string;
  onTaskClick: (taskId: string) => void;
}

const REVIEW_EVENTS = new Set(['task_submitted', 'task_returned', 'task_accepted']);
const OUTCOME_ORDER: Record<Outcome, number> = { awaiting: 0, returned: 1, accepted: 2 };
const OUTCOME_BADGE: Record<Outcome, { label: string; color: string }> = {
  awaiting: { label: 'AWAITING DECISION', color: 'violet' },
  returned: { label: 'RETURNED', color: 'orange' },
  accepted: { label: 'ACCEPTED', color: 'teal' },
};

const formatDate = (value: string | null) => (value ? dayjs(value).format('YYYY-MM-DD') : '—');

/** FR-15 / FR-16: the outcome of everything the member has submitted, and how long it has waited. */
export function SubmittedWorkTable({ personId, date, onTaskClick }: SubmittedWorkTableProps) {
  const [filter, setFilter] = useState<'all' | Outcome>('all');
  const { data: tasks = [], isLoading } = useTasks({ assigneeId: personId });
  const { data: projects = [] } = useProjects();
  const { data: ledger = [] } = useLedger();

  if (isLoading) return <Text>Loading submitted work...</Text>;

  const reviewEvents = new Map<string, LedgerRecord[]>();
  for (const record of ledger) {
    if (!REVIEW_EVENTS.has(record.type)) continue;
    reviewEvents.set(record.subjectId, [...(reviewEvents.get(record.subjectId) ?? []), record]);
  }

  const rows: SubmittedRow[] = [];
  for (const task of tasks) {
    if (task.status === 'cancelled') continue;
    // Backends return the ledger in different orders, so sort oldest first here.
    const events = (reviewEvents.get(task.id) ?? []).sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt),
    );
    const lastSubmitted = [...events].reverse().find((e) => e.type === 'task_submitted');
    const lastEvent = events.at(-1);
    const project = projects.find((p) => p.id === task.projectId)?.name ?? 'Unknown Project';
    const base = { id: task.id, title: task.title, project, reason: null, waitingDays: 0 };

    if (task.status === 'submitted') {
      const submittedAt = task.submittedAt ?? lastSubmitted?.occurredAt ?? null;
      rows.push({
        ...base,
        outcome: 'awaiting',
        submittedAt,
        decidedAt: null,
        waitingDays: submittedAt ? getWorkingDaysElapsed(submittedAt, date) : 0,
      });
    } else if (task.status === 'accepted') {
      rows.push({
        ...base,
        outcome: 'accepted',
        submittedAt: lastSubmitted?.occurredAt ?? null,
        decidedAt: task.acceptedAt,
      });
    } else if (lastEvent?.type === 'task_returned') {
      rows.push({
        ...base,
        outcome: 'returned',
        submittedAt: lastSubmitted?.occurredAt ?? null,
        decidedAt: lastEvent.occurredAt,
        reason: lastEvent.reason,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.outcome !== b.outcome) return OUTCOME_ORDER[a.outcome] - OUTCOME_ORDER[b.outcome];
    if (a.outcome === 'awaiting') return b.waitingDays - a.waitingDays;
    return (b.decidedAt ?? '').localeCompare(a.decidedAt ?? '');
  });

  const count = (outcome: Outcome) => rows.filter((row) => row.outcome === outcome).length;
  const visibleRows = filter === 'all' ? rows : rows.filter((row) => row.outcome === filter);

  const columns: TableColumn<SubmittedRow>[] = [
    {
      key: 'title',
      label: 'Task',
      width: '32%',
      render: (row) => (
        <UnstyledButton onClick={() => onTaskClick(row.id)}>
          <Text size="sm" fw={600}>
            {row.title}
          </Text>
        </UnstyledButton>
      ),
    },
    {
      key: 'project',
      label: 'Project',
      width: '20%',
      render: (row) => (
        <Text size="sm" c="dimmed">
          {row.project}
        </Text>
      ),
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      width: '12%',
      render: (row) => <Text size="sm">{formatDate(row.submittedAt)}</Text>,
    },
    {
      key: 'outcome',
      label: 'Outcome',
      width: '14%',
      render: (row) => (
        <Badge size="sm" variant="light" color={OUTCOME_BADGE[row.outcome].color}>
          {OUTCOME_BADGE[row.outcome].label}
        </Badge>
      ),
    },
    {
      key: 'detail',
      label: 'Waiting / Decision',
      width: '22%',
      render: (row) =>
        row.outcome === 'awaiting' ? (
          <Text size="sm" fw={500} c={row.waitingDays >= 3 ? 'orange.7' : undefined}>
            Waiting {row.waitingDays} working day{row.waitingDays === 1 ? '' : 's'}
          </Text>
        ) : (
          <Stack gap={2}>
            <Text size="sm">
              {row.outcome === 'accepted' ? 'Accepted' : 'Returned'} {formatDate(row.decidedAt)}
            </Text>
            {row.reason && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                {row.reason}
              </Text>
            )}
          </Stack>
        ),
    },
  ];

  return (
    <Stack gap="md">
      <SegmentedControl
        value={filter}
        onChange={(value) => setFilter(value as 'all' | Outcome)}
        data={[
          { value: 'all', label: `All (${rows.length})` },
          { value: 'awaiting', label: `Awaiting (${count('awaiting')})` },
          { value: 'returned', label: `Returned (${count('returned')})` },
          { value: 'accepted', label: `Accepted (${count('accepted')})` },
        ]}
        style={{ alignSelf: 'flex-start' }}
      />
      <ReusableTable
        columns={columns}
        data={visibleRows}
        emptyMessage="Nothing submitted yet. Submit a task from My Work when it is ready for review."
      />
    </Stack>
  );
}
