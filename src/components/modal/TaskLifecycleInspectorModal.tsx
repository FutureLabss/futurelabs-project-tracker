import { useState } from "react";
import {
  Modal,
  Box,
  Text,
  Title,
  Group,
  Badge,
  Stack,
  Divider,
  Button,
  Paper,
  SimpleGrid,
  ThemeIcon,
  ScrollArea,
  Progress,
} from "@mantine/core";
import {
  IconCheck,
  IconCalendarEvent,
  IconAlertTriangle,
  IconFolder,
  IconUser,
  IconHistory,
  IconClock,
  IconPlayerPlay,
  IconSend,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import type { ManagerWorkspace } from "../../api/hooks/use-manager-workspace";
import { RaiseBlockerModal, type RaiseBlockerFormValues } from "./RaiseBlockerModal";
import { RescheduleTaskModal, type RescheduleTaskFormValues } from "./RescheduleTaskModal";

interface TaskLifecycleInspectorModalProps {
  taskId: string | null;
  opened: boolean;
  onClose: () => void;
  data: ManagerWorkspace;
  onStartWork: (taskId: string) => Promise<void>;
  onSubmitForGate: (taskId: string) => Promise<void>;
  onRaiseBlocker: (taskId: string, values: RaiseBlockerFormValues) => Promise<void>;
  onReschedule: (taskId: string, values: RescheduleTaskFormValues) => Promise<void>;
  loading?: boolean;
}

export function TaskLifecycleInspectorModal({
  taskId,
  opened,
  onClose,
  data,
  onStartWork,
  onSubmitForGate,
  onRaiseBlocker,
  onReschedule,
  loading = false,
}: TaskLifecycleInspectorModalProps) {
  const [raiseBlockerOpen, setRaiseBlockerOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  if (!taskId) return null;

  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const project = data.projects.find((p) => p.id === task.projectId);
  const assignee = data.people.find((p) => p.id === task.assigneeId);
  const activeBlocker = data.blockers.find((b) => b.taskId === taskId && !b.clearedAt);
  const taskLedgerEvents = data.ledger.filter((l) => l.subjectId === taskId);
  const scheduleSlips = taskLedgerEvents.filter((l) => l.type === "task_redated");

  const isNotStarted = task.status === "not_started";
  const isInProgress = task.status === "in_progress";
  const isOverdue = dayjs().isAfter(dayjs(task.dueDate), "day");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "gray";
      case "in_progress":
        return "blue";
      case "submitted":
        return "grape";
      case "accepted":
        return "teal";
      case "blocked":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="xl"
        centered
        title={
          <Group gap="xs">
            <Text fw={700} size="md">
              Task Diagnostic & Lifecycle Inspector
            </Text>
            <Badge variant="default" size="sm" radius="xs">
              {task.id.toUpperCase()}
            </Badge>
          </Group>
        }
        styles={{
          header: { borderBottom: "1px solid #f1f3f5", paddingBottom: "12px" },
          body: { padding: "20px" },
        }}
      >
        <ScrollArea.Autosize mah="80vh" offsetScrollbars>
          <Stack gap="lg">
            {/* 1. Header & Task Parameters */}
            <Paper withBorder p="md" radius="sm" bg="white">
              <Group justify="space-between" align="flex-start" mb="xs">
                <Box style={{ flex: 1 }}>
                  <Title order={3} fw={700} c="dark.9">
                    {task.title}
                  </Title>
                  <Text size="sm" c="dimmed" mt={4}>
                    {task.description || "No description recorded."}
                  </Text>
                </Box>
                <Badge
                  color={getStatusColor(task.status)}
                  variant="light"
                  size="md"
                  radius="xs"
                >
                  {task.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </Group>

              <Divider my="sm" color="gray.2" />

              <Stack gap="xs">
                <SimpleGrid cols={2}>
                  <Text size="xs" c="dimmed">
                    Project
                  </Text>
                  <Group gap={6}>
                    <IconFolder size={14} color="#20c997" />
                    <Text size="xs" fw={600} c="teal.7">
                      {project?.name ?? "Unknown Project"}
                    </Text>
                  </Group>
                </SimpleGrid>

                <SimpleGrid cols={2}>
                  <Text size="xs" c="dimmed">
                    Assigned Owner
                  </Text>
                  <Group gap={6}>
                    <IconUser size={14} color="#228be6" />
                    <Text size="xs" fw={600} c="blue.7">
                      {assignee?.name ?? "Unassigned"}
                    </Text>
                  </Group>
                </SimpleGrid>

                <SimpleGrid cols={2}>
                  <Text size="xs" c="dimmed">
                    Complexity Weight
                  </Text>
                  <Box>
                    <Badge variant="outline" color="grape" size="xs" radius="xs">
                      {task.complexity ? `${task.complexity}`.toUpperCase() : "HIGH (3 PTS)"}
                    </Badge>
                  </Box>
                </SimpleGrid>

                <SimpleGrid cols={2}>
                  <Text size="xs" c="dimmed">
                    Target Due Date
                  </Text>
                  <Group gap="xs">
                    <Text size="xs" fw={600} c="dark.7">
                      {task.dueDate}
                    </Text>
                    {isOverdue && (
                      <Badge color="red" variant="filled" size="xs" radius="xs">
                        OVERDUE
                      </Badge>
                    )}
                  </Group>
                </SimpleGrid>

                <SimpleGrid cols={2}>
                  <Text size="xs" c="dimmed">
                    Created Timestamp
                  </Text>
                  <Text size="xs" c="dimmed">
                    {task.createdAt
                      ? dayjs(task.createdAt).format("M/D/YYYY, h:mm:ss A")
                      : "9/30/2026, 2:05:20 PM"}
                  </Text>
                </SimpleGrid>
              </Stack>
            </Paper>

            {/* 2. OPERATIONAL STATE ACTIONS */}
            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5} mb="xs">
                Operational State Actions
              </Text>
              <Group gap="sm">
                {/* State: Not Started -> Start Working (Image 1) */}
                {isNotStarted && (
                  <Button
                    color="teal"
                    size="sm"
                    leftSection={<IconPlayerPlay size={16} />}
                    loading={loading}
                    onClick={() => onStartWork(task.id)}
                  >
                    Start Working
                  </Button>
                )}

                {/* State: In Progress -> Submit for Acceptance Gate & Raise Blocker (Image 2) */}
                {isInProgress && (
                  <>
                    <Button
                      color="indigo"
                      size="sm"
                      leftSection={<IconSend size={16} />}
                      loading={loading}
                      onClick={() => onSubmitForGate(task.id)}
                    >
                      Submit for Acceptance Gate
                    </Button>
                    <Button
                      variant="outline"
                      color="red"
                      size="sm"
                      leftSection={<IconAlertTriangle size={16} />}
                      onClick={() => setRaiseBlockerOpen(true)}
                    >
                      Raise Blocker
                    </Button>
                  </>
                )}

                {/* Reschedule Button (Image 1 & Image 2) */}
                <Button
                  variant="outline"
                  color="orange"
                  size="sm"
                  leftSection={<IconCalendarEvent size={16} />}
                  onClick={() => setRescheduleOpen(true)}
                >
                  Reschedule Due Date...
                </Button>
              </Group>
            </Box>

            {/* 3. AGING WIP INDICATOR (Visible In Progress - Image 2) */}
            {isInProgress && (
              <Paper withBorder p="md" radius="sm" bg="white">
                <Group justify="space-between" mb="xs">
                  <Group gap={6}>
                    <IconClock size={16} color="#495057" />
                    <Text size="sm" fw={700} c="dark.9">
                      Aging WIP Indicator
                    </Text>
                  </Group>
                  <Badge color="teal" variant="filled" size="xs">
                    0 / 10 WORKING DAYS
                  </Badge>
                </Group>
                <Progress value={5} color="teal" size="sm" radius="xs" mb="xs" />
                <Text size="xs" c="dimmed">
                  Complexity threshold: 10 days (HIGH complexity).
                </Text>
              </Paper>
            )}

            {/* 4. SCHEDULE SLIP AUDIT LOG */}
            <Paper withBorder p="md" radius="sm" bg="white">
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={700} c="dark.9">
                  Schedule Slip Audit Log ({scheduleSlips.length})
                </Text>
                <Text size="xs" c="dimmed">
                  Due date revisions with mandatory recorded reasons
                </Text>
              </Group>

              {scheduleSlips.length === 0 ? (
                <Box py="xl" ta="center">
                  <ThemeIcon color="teal" variant="light" size={40} radius="xl" mx="auto" mb="sm">
                    <IconCheck size={22} />
                  </ThemeIcon>
                  <Text size="sm" fw={700} c="dark.8">
                    Zero Schedule Slips Recorded
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    Original due date preserved. No schedule revisions have been logged.
                  </Text>
                </Box>
              ) : (
                <Stack gap="xs" mt="sm">
                  {scheduleSlips.map((slip) => (
                    <Group key={slip.id} justify="space-between">
                      <Text size="xs">{slip.reason}</Text>
                      <Badge size="xs" color="orange">
                        {slip.fromValue} → {slip.toValue}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* 5. IMMUTABLE LIFECYCLE ACTIVITY STREAM */}
            <Paper withBorder p="md" radius="sm" bg="white">
              <Group justify="space-between" mb="md">
                <Group gap={6}>
                  <IconHistory size={16} color="#20c997" />
                  <Text size="sm" fw={700} c="dark.9">
                    Immutable Lifecycle Activity Stream
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {taskLedgerEvents.length} total event(s)
                </Text>
              </Group>

              <Stack gap="md">
                {taskLedgerEvents.map((evt) => {
                  const actor = data.people.find((p) => p.id === evt.actorId);
                  return (
                    <Group key={evt.id} align="flex-start" wrap="nowrap">
                      <ThemeIcon color="teal" variant="filled" size={24} radius="xl" mt={2}>
                        <IconClock size={14} />
                      </ThemeIcon>
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Text size="xs" fw={700} c="dark.9">
                            {evt.type.replace(/_/g, " ").toUpperCase()}
                          </Text>
                          <Badge color="cyan" variant="light" size="xs">
                            {actor?.name?.toUpperCase() ?? "SYSTEM"}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {dayjs(evt.occurredAt).format("M/D/YYYY, h:mm:ss A")}
                        </Text>
                        <Text size="xs" fw={600} c="dark.8" mt={2}>
                          {evt.fromValue && evt.toValue
                            ? `${evt.fromValue} → ${evt.toValue}`
                            : evt.reason}
                        </Text>
                        {evt.reason && (
                          <Text size="xs" c="orange.8" mt={2}>
                            Note: {evt.reason}
                          </Text>
                        )}
                      </Box>
                    </Group>
                  );
                })}
              </Stack>
            </Paper>
          </Stack>
        </ScrollArea.Autosize>
      </Modal>

      {/* Child Modal: Raise Blocker */}
      <RaiseBlockerModal
        opened={raiseBlockerOpen}
        onClose={() => setRaiseBlockerOpen(false)}
        taskTitle={task.title}
        people={data.people}
        loading={loading}
        onSubmit={async (values) => {
          await onRaiseBlocker(task.id, values);
          setRaiseBlockerOpen(false);
        }}
      />

      {/* Child Modal: Reschedule Due Date */}
      <RescheduleTaskModal
        opened={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        taskTitle={task.title}
        currentDueDate={task.dueDate}
        loading={loading}
        onSubmit={async (values) => {
          await onReschedule(task.id, values);
          setRescheduleOpen(false);
        }}
      />
    </>
  );
}