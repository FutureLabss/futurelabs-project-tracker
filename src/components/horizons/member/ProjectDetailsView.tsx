import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Progress,
  Button
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconFolder,
  IconAlertTriangle,
  IconClock,
} from '@tabler/icons-react';
import { useProjects } from '../../../api/hooks/use-projects';
import { useTasks } from '../../../api/hooks/use-tasks';
import { useSignals } from '../../../api/hooks/use-signals';
import { useLedger } from '../../../api/hooks/use-ledger';
import { usePersons } from '../../../api/hooks/use-availability';
import { ReusableTable, TableColumn } from '../../Table/ReusableTable';
import { readable } from '../admin/admin-utils';
import { RagBadge } from '../admin/atoms/RagBadge';
import { TaskComplexity } from '../../../entities/task.entity';

interface ProjectDetailsViewProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetailsView({ projectId, onBack }: ProjectDetailsViewProps) {
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks({ projectId });
  
  // Use today's date for signals
  const today = new Date().toISOString().split('T')[0];
  const { data: signals } = useSignals(today);
  const { data: ledger = [] } = useLedger();
  const { data: persons = [] } = usePersons();

  const project = projects.find((p) => p.id === projectId);
  
  if (!project) {
    return <Text>Project not found.</Text>;
  }

  const projectSummary = signals?.projectSummaries.find(s => s.projectId === projectId);
  
  const getComplexityPoints = (complexity: TaskComplexity) => {
    if (complexity === 'high') return 3;
    if (complexity === 'mid') return 2;
    if (complexity === 'low') return 1;
    return 0;
  };

  const totalComplexity = tasks.reduce((sum, t) => sum + getComplexityPoints(t.complexity), 0);
  const completedComplexity = tasks
    .filter(t => t.status === 'accepted')
    .reduce((sum, t) => sum + getComplexityPoints(t.complexity), 0);
  
  const completionPercent = totalComplexity > 0 ? Math.round((completedComplexity / totalComplexity) * 100) : 0;

  const statusDistribution = {
    'not_started': tasks.filter(t => t.status === 'not_started').length,
    'in_progress': tasks.filter(t => t.status === 'in_progress').length,
    'blocked': tasks.filter(t => t.status === 'blocked').length,
    'submitted': tasks.filter(t => t.status === 'submitted').length,
    'accepted': tasks.filter(t => t.status === 'accepted').length,
    'cancelled': tasks.filter(t => t.status === 'cancelled').length,
  };

  const unassignedTasks = tasks.filter(t => !t.assigneeId && t.status !== 'accepted' && t.status !== 'cancelled');

  const personName = (id: string | null) => {
    if (!id) return "Unassigned";
    return persons.find(p => p.id === id)?.name || "Unknown";
  };

  const relatedLedger = ledger.filter(r => 
    r.subjectId === projectId || 
    tasks.some(t => t.id === r.subjectId)
  );

  const taskColumns: TableColumn<any>[] = [
    {
      key: 'title',
      label: 'Task Title',
      width: '30%',
      render: (t) => <Text size="sm" fw={500}>{t.title}</Text>
    },
    {
      key: 'assignee',
      label: 'Assignee',
      width: '20%',
      render: (t) => <Text size="sm" c="teal.7">{personName(t.assigneeId)}</Text>
    },
    {
      key: 'complexity',
      label: 'Complexity',
      width: '15%',
      render: (t) => (
        <Badge variant="outline" color={t.complexity === 'high' ? 'pink' : t.complexity === 'mid' ? 'blue' : 'green'}>
          {t.complexity.toUpperCase()} ({getComplexityPoints(t.complexity)} PT{getComplexityPoints(t.complexity) > 1 ? 'S' : ''})
        </Badge>
      )
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      width: '15%',
      render: (t) => <Text size="sm">{t.dueDate}</Text>
    },
    {
      key: 'status',
      label: 'Status',
      width: '20%',
      render: (t) => {
        let color = 'gray';
        if (t.status === 'in_progress') color = 'blue';
        if (t.status === 'blocked') color = 'red';
        if (t.status === 'submitted') color = 'violet';
        if (t.status === 'accepted') color = 'teal';
        return <Badge color={color} variant="light">{readable(t.status).toUpperCase()}</Badge>;
      }
    }
  ];

  const ledgerColumns: TableColumn<any>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      width: '15%',
      render: (r) => <Text size="sm" c="dimmed">{new Date(r.occurredAt).toLocaleDateString()}</Text>
    },
    {
      key: 'actor',
      label: 'Actor',
      width: '15%',
      render: (r) => <Text size="sm">{personName(r.actorId)}</Text>
    },
    {
      key: 'eventType',
      label: 'Event Type',
      width: '15%',
      render: (r) => <Badge color="blue" variant="light">{readable(r.type).toUpperCase()}</Badge>
    },
    {
      key: 'transition',
      label: 'Transition',
      width: '20%',
      render: (r) => <Text size="sm">{r.fromValue || '-'} → {r.toValue || '-'}</Text>
    },
    {
      key: 'notes',
      label: 'Notes',
      width: '35%',
      render: (r) => <Text size="sm" c="dimmed" lineClamp={2}>{r.reason}</Text>
    }
  ];

  return (
    <Stack gap="xl">
      {/* HEADER */}
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs" c="dimmed">
            <IconFolder size={18} />
            <Text size="sm">Home Horizon</Text>
            <Text size="sm">&gt;</Text>
            <Text size="sm">Projects & Initiatives</Text>
            <Text size="sm">&gt;</Text>
            <Text size="sm" fw={600} c="dark">{project.name}</Text>
          </Group>
          <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={onBack}>
            Return to Horizon
          </Button>
        </Group>

        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between" align="flex-start">
            <Group align="flex-start" gap="md">
              <IconFolder size={32} color="var(--mantine-color-blue-6)" style={{ marginTop: 4 }} />
              <Box>
                <Title order={2} size="h3">{project.name}</Title>
                <Text c="dimmed" size="sm" mt={4}>{project.goal}</Text>
              </Box>
            </Group>
            {projectSummary && <RagBadge status={projectSummary.ragStatus} closed={project.state === 'closed'} />}
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mt="xl">
            <Paper withBorder p="sm" radius="sm">
              <Text size="xs" c="dimmed" fw={600}>Designated Lead</Text>
              <Text size="sm" fw={600} c="teal.7" mt={4}>{personName(project.managerId)}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="sm">
              <Text size="xs" c="dimmed" fw={600}>Target Delivery Date</Text>
              <Text size="sm" fw={600} mt={4}>{project.targetDate}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="sm">
              <Text size="xs" c="dimmed" fw={600}>Start Date</Text>
              <Text size="sm" fw={600} mt={4}>{project.startDate}</Text>
            </Paper>
            <Paper withBorder p="sm" radius="sm">
              <Text size="xs" c="dimmed" fw={600}>Delivery Lifecycle State</Text>
              <Badge color={project.state === 'active' ? 'teal' : 'gray'} mt={4} variant="light">
                {project.state.toUpperCase()}
              </Badge>
            </Paper>
          </SimpleGrid>
        </Paper>
      </Stack>

      {/* DIAGNOSTICS */}
      {projectSummary?.ragReasons && projectSummary.ragReasons.length > 0 && (
        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between" mb="md">
            <Group gap="sm">
              <IconAlertTriangle size={24} color="var(--mantine-color-orange-6)" />
              <Title order={4}>Deterministic Mathematical RAG Diagnostics</Title>
            </Group>
            <RagBadge status={projectSummary.ragStatus} closed={project.state === 'closed'} />
          </Group>
          <Text size="sm" c="dimmed" mb="lg">
            Calculated dynamically from target date variance, overdue deliverable count, open blockers, and slip logs.
          </Text>
          <Stack gap="xs">
            {projectSummary.ragReasons.map((reason, idx) => (
              <Group key={idx} gap="xs">
                <IconClock size={16} color="var(--mantine-color-gray-5)" />
                <Text size="sm">{reason}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {/* METRICS ROW */}
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Title order={5}>Complexity-Weighted Completion</Title>
            <Badge color="teal" variant="light">{completedComplexity} / {totalComplexity} PTS ({completionPercent}%)</Badge>
          </Group>
          <Group justify="center" mb="lg">
            <RingProgress
              size={140}
              thickness={16}
              sections={[{ value: completionPercent, color: 'teal' }]}
              label={
                <Text ta="center" size="xl" fw={700}>
                  {completionPercent}%
                </Text>
              }
            />
          </Group>
          <Progress value={completionPercent} color="teal" size="xl" radius="xl" />
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between" mb="lg">
            <Title order={5}>Deliverable Status Distribution ({tasks.length})</Title>
          </Group>
          <SimpleGrid cols={2} spacing="md">
            {Object.entries(statusDistribution).map(([status, count]) => {
              let color = 'gray';
              if (status === 'blocked') color = 'red.6';
              if (status === 'in_progress') color = 'blue.6';
              if (status === 'accepted') color = 'teal.6';
              if (status === 'submitted') color = 'violet.6';

              return (
                <Paper key={status} withBorder p="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{readable(status)}</Text>
                    <Badge color={color} variant="light" size="sm">{count}</Badge>
                  </Group>
                </Paper>
              )
            })}
          </SimpleGrid>
        </Paper>
      </SimpleGrid>

      {/* UNASSIGNED TASKS TRAY */}
      <Paper withBorder p="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <IconAlertTriangle size={20} color={unassignedTasks.length > 0 ? "var(--mantine-color-orange-6)" : "var(--mantine-color-gray-4)"} />
            <Title order={5}>Unassigned Tasks Intake Tray ({unassignedTasks.length})</Title>
          </Group>
          <Text size="xs" c="dimmed">Work items needing owner designation</Text>
        </Group>
        
        {unassignedTasks.length === 0 ? (
          <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
            <ActionIcon size="xl" color="teal" variant="light" radius="xl" mb="sm" mx="auto">
              <IconCheck size={24} />
            </ActionIcon>
            <Title order={5}>All Tasks Assigned</Title>
            <Text size="sm" c="dimmed">Every active deliverable in this initiative has a designated owner.</Text>
          </Paper>
        ) : (
          <ReusableTable columns={taskColumns} data={unassignedTasks} />
        )}
      </Paper>

      {/* ALL TASKS */}
      <Paper withBorder p="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={5}>Project Deliverables & Work Items ({tasks.length})</Title>
          <Text size="xs" c="dimmed">Click any task to inspect details in side drawer</Text>
        </Group>
        <ReusableTable columns={taskColumns} data={tasks} />
      </Paper>

      {/* LEDGER */}
      <Paper withBorder p="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={5}>Project Change Ledger Feed ({relatedLedger.length})</Title>
          <Text size="xs" c="dimmed">Filtered strictly to this initiative • Click any row for raw audit inspection</Text>
        </Group>
        <ReusableTable columns={ledgerColumns} data={relatedLedger} />
      </Paper>
    </Stack>
  );
}
