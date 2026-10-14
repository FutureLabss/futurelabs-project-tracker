import { useState } from "react";
import {
  Button,
  Card,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconClipboardCheck,
  IconFlame,
  IconLayoutKanban,
  IconPlus,
  IconTable,
  IconUsers,
} from "@tabler/icons-react";
import {
  useTasks,
  useUpdateTaskStatus,
  useAcceptTask,
  useReturnTask,
} from "../../../api/hooks/use-tasks";
import { useProjects } from "../../../api/hooks/use-projects";
import { usePersons } from "../../../api/hooks/use-availability";
import {
  useRaiseBlocker,
  useClearBlocker,
} from "../../../api/hooks/use-blockers";
import type { BlockerCategory } from "../../../entities/blocker.entity";
import { TaskBoard } from "../../task-board";
import { CreateTaskModal } from "../member/organisms/CreateTaskModal";

interface ManagerDashboardProps {
  managerId: string;
  managerName?: string;
  activeDate?: string;
}

type ManagerAction =
  | { kind: "accept"; taskId: string; taskTitle?: string }
  | { kind: "return"; taskId: string; taskTitle?: string }
  | { kind: "blocker"; taskId: string; taskTitle?: string }
  | { kind: "clear"; taskId: string; blockerId: string; taskTitle?: string };

export default function ManagerDashboard({
  managerId,
  managerName,
}: ManagerDashboardProps) {
  const { data: allTasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: people = [] } = usePersons();

  const updateTaskStatusMutation = useUpdateTaskStatus();
  const acceptTaskMutation = useAcceptTask();
  const returnTaskMutation = useReturnTask();
  const raiseBlockerMutation = useRaiseBlocker();
  const clearBlockerMutation = useClearBlocker();

  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createTaskOpened, setCreateTaskOpened] = useState(false);
  const [action, setAction] = useState<ManagerAction | null>(null);

  // Return dialog reason
  const [returnReason, setReturnReason] = useState("");
  const [blockerCategory, setBlockerCategory] =
    useState<BlockerCategory>("unclear_requirement");
  const [blockerReason, setBlockerReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter tasks belonging to managed projects or all if manager
  const managedProjectIds = new Set(
    projects.filter((p) => p.managerId === managerId).map((p) => p.id),
  );

  const displayTasks = allTasks.filter((t) => {
    // If manager has assigned projects, prioritize them; else show all
    if (managedProjectIds.size > 0 && !managedProjectIds.has(t.projectId)) {
      return false;
    }
    if (projectFilter && t.projectId !== projectFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const reviewQueue = displayTasks.filter((t) => t.status === "submitted");
  const blockedTasks = displayTasks.filter((t) => t.status === "blocked");
  const activeTasks = displayTasks.filter(
    (t) => t.status !== "accepted" && t.status !== "cancelled",
  );

  const totalPoints = activeTasks.reduce((sum, t) => {
    return sum + (t.complexity === "high" ? 3 : t.complexity === "mid" ? 2 : 1);
  }, 0);

  const handleActionSubmit = async () => {
    if (!action) return;
    setActionError(null);
    try {
      if (action.kind === "accept") {
        await acceptTaskMutation.mutateAsync({
          taskId: action.taskId,
          managerId,
        });
      } else if (action.kind === "return") {
        if (!returnReason.trim()) {
          setActionError("Please provide a reason for returning this task.");
          return;
        }
        await returnTaskMutation.mutateAsync({
          taskId: action.taskId,
          managerId,
          reason: returnReason,
        });
      } else if (action.kind === "blocker") {
        if (!blockerReason.trim()) {
          setActionError("Please describe the blocker.");
          return;
        }
        await raiseBlockerMutation.mutateAsync({
          taskId: action.taskId,
          ownerId: managerId,
          category: blockerCategory,
          description: blockerReason,
          actorId: managerId,
        });
      } else if (action.kind === "clear") {
        await clearBlockerMutation.mutateAsync({
          blockerId: action.blockerId,
          actorId: managerId,
        });
      }
      setAction(null);
      setReturnReason("");
      setBlockerReason("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    }
  };

  return (
    <Stack gap="xl" className="dashboard-shell">
      {/* Header */}
      <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
        <Stack gap={4}>
          <Title order={2}>Team Delivery Command</Title>
          <Text c="dimmed" size="sm">
            {managerName ? `Welcome back, ${managerName}. ` : ""}
            Inspect team progress, review submitted deliverables, and remove blockers.
          </Text>
        </Stack>

        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateTaskOpened(true)}
        >
          Create Task
        </Button>
      </Group>

      {/* Metrics Row */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Active Team Tasks
              </Text>
              <Text size="xl" fw={700}>
                {activeTasks.length}
              </Text>
            </Stack>
            <IconUsers size={22} color="var(--mantine-color-blue-6)" />
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            Currently in queue
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Review Gate
              </Text>
              <Text size="xl" fw={700} c={reviewQueue.length > 0 ? "orange.7" : undefined}>
                {reviewQueue.length}
              </Text>
            </Stack>
            <IconClipboardCheck size={22} color="var(--mantine-color-orange-6)" />
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            Awaiting acceptance
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Blocked Items
              </Text>
              <Text size="xl" fw={700} c={blockedTasks.length > 0 ? "red.7" : undefined}>
                {blockedTasks.length}
              </Text>
            </Stack>
            <IconAlertTriangle size={22} color="var(--mantine-color-red-6)" />
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            Require intervention
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Total Complexity
              </Text>
              <Text size="xl" fw={700}>
                {totalPoints} pts
              </Text>
            </Stack>
            <IconFlame size={22} color="var(--mantine-color-grape-6)" />
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            Active workload weight
          </Text>
        </Card>
      </SimpleGrid>

      {/* Main Board View Card */}
      <Paper withBorder radius="md" p="md">
        <Stack gap="md">
          {/* Controls Bar */}
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
            <Group align="flex-end" gap="sm" wrap="wrap">
              <Select
                label="Filter by Project"
                placeholder="All projects"
                clearable
                searchable
                data={projects.map((p) => ({ value: p.id, label: p.name }))}
                value={projectFilter}
                onChange={setProjectFilter}
                maw={280}
              />
              <Select
                label="Filter by Status"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v ?? "all")}
                data={[
                  { value: "all", label: "All Statuses" },
                  { value: "not_started", label: "Not Started" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "blocked", label: "Blocked" },
                  { value: "submitted", label: "In Review" },
                  { value: "accepted", label: "Accepted" },
                ]}
                maw={200}
              />
            </Group>

            <SegmentedControl
              value={viewMode}
              onChange={(val) => setViewMode(val as "board" | "table")}
              data={[
                {
                  value: "board",
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconLayoutKanban size={15} />
                      <span>Board</span>
                    </Group>
                  ),
                },
                {
                  value: "table",
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <IconTable size={15} />
                      <span>List</span>
                    </Group>
                  ),
                },
              ]}
            />
          </Group>

          {/* Draggable Task Board */}
          {viewMode === "board" ? (
            <TaskBoard
              tasks={displayTasks}
              projects={projects}
              people={people}
              onTaskStatusChange={async (taskId, targetStatus) => {
                await updateTaskStatusMutation.mutateAsync({
                  taskId,
                  status: targetStatus,
                  actorId: managerId,
                });
              }}
              onTaskActionRequired={(req) => {
                const targetTask = displayTasks.find((t) => t.id === req.taskId);
                if (req.kind === "accept") {
                  setAction({
                    kind: "accept",
                    taskId: req.taskId,
                    taskTitle: targetTask?.title,
                  });
                } else if (req.kind === "return") {
                  setAction({
                    kind: "return",
                    taskId: req.taskId,
                    taskTitle: targetTask?.title,
                  });
                } else if (req.kind === "blocker") {
                  setAction({
                    kind: "blocker",
                    taskId: req.taskId,
                    taskTitle: targetTask?.title,
                  });
                } else if (req.kind === "clear" && req.blockerId) {
                  setAction({
                    kind: "clear",
                    taskId: req.taskId,
                    blockerId: req.blockerId,
                    taskTitle: targetTask?.title,
                  });
                }
              }}
              onCreateTask={() => setCreateTaskOpened(true)}
              storageKey="futurelabs_manager_taskboard_cols_v1"
            />
          ) : (
            <Stack gap="xs">
              {displayTasks.map((t) => (
                <Card key={t.id} withBorder p="sm" radius="md">
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text fw={600} size="sm">
                        {t.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {projects.find((p) => p.id === t.projectId)?.name} ·{" "}
                        {people.find((p) => p.id === t.assigneeId)?.name ??
                          "Unassigned"}{" "}
                        · Due {t.dueDate}
                      </Text>
                    </Stack>
                    <Group gap="xs">
                      {t.status === "submitted" && (
                        <>
                          <Button
                            size="xs"
                            color="teal"
                            onClick={() =>
                              setAction({
                                kind: "accept",
                                taskId: t.id,
                                taskTitle: t.title,
                              })
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            color="orange"
                            onClick={() =>
                              setAction({
                                kind: "return",
                                taskId: t.id,
                                taskTitle: t.title,
                              })
                            }
                          >
                            Return
                          </Button>
                        </>
                      )}
                    </Group>
                  </Group>
                </Card>
              ))}
              {displayTasks.length === 0 && (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No tasks found matching this criteria.
                </Text>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Create Task Modal */}
      <CreateTaskModal
        opened={createTaskOpened}
        onClose={() => setCreateTaskOpened(false)}
        personId={managerId}
      />

      {/* Action Dialog */}
      <Modal
        opened={!!action}
        onClose={() => setAction(null)}
        title={
          action?.kind === "accept"
            ? "Accept Outcome & Deliverable"
            : action?.kind === "return"
              ? "Return Deliverable for Rework"
              : action?.kind === "blocker"
                ? "Raise Blocker"
                : "Clear Blocker"
        }
        centered
      >
        <Stack gap="sm">
          {action?.taskTitle && (
            <Text size="sm" c="dimmed">
              Task: <Text span fw={600} c="var(--mantine-color-text)">{action.taskTitle}</Text>
            </Text>
          )}

          {action?.kind === "accept" && (
            <Text size="sm">
              Confirm that this task deliverable meets quality requirements and
              should be marked as accepted.
            </Text>
          )}

          {action?.kind === "return" && (
            <Textarea
              label="Rework Reason"
              placeholder="Explain why this deliverable needs adjustments..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.currentTarget.value)}
              minRows={3}
              required
            />
          )}

          {action?.kind === "blocker" && (
            <>
              <Select
                label="Category"
                value={blockerCategory}
                onChange={(v) =>
                  setBlockerCategory((v as BlockerCategory) ?? "unclear_requirement")
                }
                data={[
                  { value: "unclear_requirement", label: "Unclear Requirement" },
                  { value: "decision", label: "Pending Decision" },
                  { value: "person", label: "Person / Ownership" },
                  { value: "external", label: "External Dependency" },
                ]}
              />
              <Textarea
                label="Reason"
                placeholder="What is blocking this work?"
                value={blockerReason}
                onChange={(e) => setBlockerReason(e.currentTarget.value)}
                minRows={3}
                required
              />
            </>
          )}

          {action?.kind === "clear" && (
            <Text size="sm">
              Are you sure you want to clear the active blocker on this task?
            </Text>
          )}

          {actionError && (
            <Text size="xs" c="red">
              {actionError}
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              color={
                action?.kind === "accept"
                  ? "teal"
                  : action?.kind === "return"
                    ? "orange"
                    : action?.kind === "blocker"
                      ? "red"
                      : "teal"
              }
              onClick={handleActionSubmit}
              loading={
                acceptTaskMutation.isPending ||
                returnTaskMutation.isPending ||
                raiseBlockerMutation.isPending ||
                clearBlockerMutation.isPending
              }
            >
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
