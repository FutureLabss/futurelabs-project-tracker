import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Drawer,
  Group,
  Stack,
  Text,
  Timeline,
  Table,
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconFolder,
  IconUser,
  IconAlertCircle,
  IconPlayerPlay,
  IconSend,
  IconCheck,
  IconClock,
  IconRefresh,
} from '@tabler/icons-react';
import { useTasks } from '../../api/hooks/use-tasks';
import { useProjects } from '../../api/hooks/use-projects';
import { usePersons } from '../../api/hooks/use-availability';
import { useLedger } from '../../api/hooks/use-ledger';
import { ReusableTable, type TableColumn } from '../Table/ReusableTable';
import { ComplexityBadge } from '../horizons/member/atoms/ComplexityBadge';
import { OverdueBadge } from '../horizons/member/atoms/OverdueBadge';

interface TaskDiagnosticDrawerProps {
  opened: boolean;
  onClose: () => void;
  taskId: string | null;
  isReadOnly?: boolean;
  onOpenRaiseBlocker?: (task: any) => void;
  onOpenReschedule?: (task: any) => void;
  onOpenClearBlocker?: (task: any) => void;
  onStartWorking?: (task: any) => void;
}

export function TaskDiagnosticDrawer({
  opened,
  onClose,
  taskId,
  isReadOnly = false,
  onOpenRaiseBlocker,
  onOpenReschedule,
  onOpenClearBlocker,
  onStartWorking,
}: TaskDiagnosticDrawerProps) {
  const { data: allTasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: persons = [] } = usePersons();
  const { data: ledger = [] } = useLedger({ subjectId: taskId || undefined });

  if (!taskId) return null;

  const task = allTasks.find((t: any) => t.id === taskId);
  if (!task) return null;

  const project = projects.find((p: any) => p.id === task.projectId);
  const assignee = persons.find((p: any) => p.id === task.assigneeId);

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'accepted' && task.status !== 'submitted';

  // Audit Logs
  const scheduleSlips = ledger.filter((l: any) => l.type === 'task_redated').sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  // Activity Stream (sort newest first for display if needed, but Timeline usually expects oldest first or newest first. Let's do newest first).
  const activityStream = [...ledger].sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task_created': return <IconPlayerPlay size={12} />;
      case 'status_changed': return <IconRefresh size={12} />;
      case 'task_redated': return <IconCalendarEvent size={12} />;
      case 'task_submitted': return <IconSend size={12} />;
      case 'task_accepted': return <IconCheck size={12} />;
      case 'blocker_raised': return <IconAlertCircle size={12} />;
      default: return <IconClock size={12} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'task_created': return 'teal';
      case 'status_changed': return 'teal';
      case 'task_redated': return 'orange';
      case 'task_submitted': return 'violet';
      case 'task_accepted': return 'green';
      case 'blocker_raised': return 'red';
      default: return 'gray';
    }
  };

  const getEventTitle = (type: string) => {
    switch (type) {
      case 'task_created': return 'Task Initialized';
      case 'status_changed': return 'Status Transition';
      case 'task_redated': return 'Due Date Slipped';
      case 'task_submitted': return 'Submitted to Review Gate';
      case 'task_accepted': return 'Task Accepted';
      case 'blocker_raised': return 'Blocker Raised';
      case 'blocker_cleared': return 'Blocker Cleared';
      default: return 'Activity Logged';
    }
  };

  const scheduleSlipColumns: TableColumn<any>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      width: '20%',
      render: (slip) => <Text size="sm" c="dimmed">{new Date(slip.occurredAt).toLocaleDateString()}</Text>
    },
    {
      key: 'adjustment',
      label: 'Adjustment',
      width: '30%',
      render: (slip) => (
        <Text size="sm" fw={600} c="orange">
          {slip.fromValue} &rarr; {slip.toValue}
        </Text>
      )
    },
    {
      key: 'actor',
      label: 'Actor',
      width: '15%',
      render: (slip) => {
        const actor = persons.find((p: any) => p.id === slip.actorId);
        return (
          <Stack gap={0}>
            <Text size="sm">{actor?.name.split(' ')[0]}</Text>
            <Text size="sm">{actor?.name.split(' ')[1]}</Text>
          </Stack>
        );
      }
    },
    {
      key: 'reason',
      label: 'Mandatory Recorded Reason',
      width: '35%',
      render: (slip) => <Text size="sm" c="orange">{slip.reason}</Text>
    }
  ];

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="xl"
      title={
        <Group>
          <Text fw={700} size="lg">Task Diagnostic & Lifecycle Inspector</Text>
          <Badge variant="outline" color="gray">TASK</Badge>
        </Group>
      }
    >
      <Stack gap="lg" pb="xl">
        {/* Task Header info */}
        <Card withBorder shadow="sm" radius="md">
          <Group justify="space-between" align="flex-start" mb="sm">
            <Text fw={700} size="xl">{task.title}</Text>
            {task.status === 'submitted' && (
              <Badge color="violet" variant="light">SUBMITTED (REVIEW)</Badge>
            )}
            {task.status === 'accepted' && (
              <Badge color="green" variant="light">ACCEPTED</Badge>
            )}
            {task.status === 'blocked' && (
              <Badge color="red" variant="light">BLOCKED</Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed" mb="xl">
            {task.description}
          </Text>

          <Divider mb="md" />

          <Table verticalSpacing="sm" withRowBorders={true} borderColor="gray.2">
            <Table.Tbody>
              <Table.Tr>
                <Table.Td w="30%"><Text size="sm" c="dimmed">Project</Text></Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <IconFolder size={16} color="teal" />
                    <Text size="sm" fw={500} c="teal">{project?.name || 'Unknown'}</Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="sm" c="dimmed">Assigned Owner</Text></Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <IconUser size={16} color="teal" />
                    <Text size="sm" fw={500} c="teal">{assignee?.name || 'Unassigned'}</Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="sm" c="dimmed">Complexity Weight</Text></Table.Td>
                <Table.Td>
                  <ComplexityBadge value={
                    task.complexity === 'high' ? 'HIGH (3 PTS)' :
                    task.complexity === 'mid' ? 'MID (2 PTS)' :
                    'LOW (1 PT)'
                  } />
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="sm" c="dimmed">Target Due Date</Text></Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>{task.dueDate}</Text>
                    {isOverdue && <OverdueBadge />}
                  </Group>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="sm" c="dimmed">Created Timestamp</Text></Table.Td>
                <Table.Td><Text size="sm">{new Date(task.createdAt).toLocaleString()}</Text></Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>

        {/* Operational State Actions */}
        {!isReadOnly && (
          <Card withBorder shadow="sm" radius="md">
            <Text fw={700} size="sm" c="dimmed" mb="md" tt="uppercase">Operational State Actions</Text>
            <Group>
              {task.status === 'not_started' && (
                <Button
                  variant="filled"
                  color="teal"
                  leftSection={<IconPlayerPlay size={16} />}
                  onClick={() => onStartWorking && onStartWorking(task as any)}
                >
                  Start Working
                </Button>
              )}
              
              {task.status !== 'not_started' && (
                <Button
                  variant="outline"
                  color="orange"
                  leftSection={<IconCalendarEvent size={16} />}
                  onClick={() => onOpenReschedule && onOpenReschedule(task as any)}
                >
                  Reschedule Due Date...
                </Button>
              )}

              {task.status === 'blocked' ? (
                <Button
                  variant="filled"
                  color="teal"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => onOpenClearBlocker && onOpenClearBlocker(task as any)}
                >
                  Clear Blocker...
                </Button>
              ) : (
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconAlertCircle size={16} />}
                  onClick={() => onOpenRaiseBlocker && onOpenRaiseBlocker(task as any)}
                >
                  Raise Blocker...
                </Button>
              )}
            </Group>
          </Card>
        )}

        {/* Deliverable Artifact */}
        <Card withBorder shadow="sm" radius="md">
          <Group justify="space-between" mb="md">
            <Text fw={700} size="sm" tt="uppercase">Deliverable Artifact & Review Gate History</Text>
            {task.status === 'submitted' && <Badge size="sm" color="violet" variant="light">AWAITING MANAGER VERIFICATION</Badge>}
            {task.status === 'accepted' && <Badge size="sm" color="green" variant="light">VERIFIED</Badge>}
          </Group>
          
          {task.deliverableUrl ? (
            <Stack gap="sm">
              <Group gap="xs">
                <Text size="sm" c="dimmed">Artifact URL:</Text>
                <Text size="sm" c="teal" component="a" href={task.deliverableUrl} target="_blank" fw={500}>{task.deliverableUrl}</Text>
              </Group>
              <Box>
                <Text size="sm" c="dimmed" mb={4}>Submission Notes:</Text>
                <Card withBorder bg="gray.0" radius="sm" p="sm">
                  <Text size="sm">{task.submissionNotes}</Text>
                </Card>
              </Box>
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">No deliverables submitted yet.</Text>
          )}
        </Card>

        {/* Schedule Slip Audit Log */}
        <Card withBorder shadow="sm" radius="md">
          <Group justify="space-between" mb="md">
            <Text fw={700} size="sm" tt="uppercase">Schedule Slip Audit Log ({scheduleSlips.length})</Text>
            <Text size="xs" c="dimmed">Due date revisions with mandatory recorded reasons</Text>
          </Group>

          {scheduleSlips.length > 0 ? (
            <ReusableTable
              columns={scheduleSlipColumns}
              data={scheduleSlips}
            />
          ) : (
            <Stack align="center" gap="xs" py="xl">
              <Badge size="xl" circle color="green" variant="light">
                <IconCheck size={20} />
              </Badge>
              <Text fw={600}>Zero Schedule Slips Recorded</Text>
              <Text size="sm" c="dimmed">Original due date preserved. No schedule revisions have been logged.</Text>
            </Stack>
          )}
        </Card>

        {/* Immutable Lifecycle Activity Stream */}
        <Card withBorder shadow="sm" radius="md">
          <Group justify="space-between" mb="xl">
            <Group gap="xs">
              <IconRefresh size={18} color="teal" />
              <Text fw={700} size="sm" tt="uppercase">Immutable Lifecycle Activity Stream</Text>
            </Group>
            <Text size="xs" c="dimmed">{activityStream.length} total event(s)</Text>
          </Group>

          <Timeline active={activityStream.length} bulletSize={24} lineWidth={2}>
            {activityStream.map((event: any) => {
              const actor = persons.find((p: any) => p.id === event.actorId);
              return (
                <Timeline.Item
                  key={event.id}
                  title={
                    <Group gap="xs">
                      <Text size="sm" fw={600}>{getEventTitle(event.type)}</Text>
                      <Badge size="xs" variant="light" color={getEventColor(event.type)} tt="uppercase">
                        {actor?.name}
                      </Badge>
                    </Group>
                  }
                  bullet={getEventIcon(event.type)}
                  color={getEventColor(event.type)}
                >
                  <Text c="dimmed" size="xs" mt={4}>{new Date(event.occurredAt).toLocaleString()}</Text>
                  
                  {event.fromValue && event.toValue && (
                    <Text size="sm" fw={500} mt={4}>
                      {event.fromValue} &rarr; {event.toValue}
                    </Text>
                  )}
                  {event.type === 'task_created' && (
                    <Text size="sm" fw={500} mt={4}>{task.title}</Text>
                  )}
                  {event.reason && (
                    <Text size="sm" c="orange" mt={4}>Note: {event.reason}</Text>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Card>
      </Stack>
    </Drawer>
  );
}
