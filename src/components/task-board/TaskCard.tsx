import { useState, type DragEvent } from "react";
import {
  Card,
  Group,
  Text,
  Badge,
  Avatar,
  Stack,
  Tooltip,
  UnstyledButton,
  ActionIcon,
  Menu,
} from "@mantine/core";
import {
  IconCalendar,
  IconAlertTriangle,
  IconGripVertical,
  IconDotsVertical,
  IconArrowRight,
  IconFlame,
} from "@tabler/icons-react";
import type { Task, TaskStatus } from "../../entities/task.entity";
import type {
  TaskBoardProject,
  TaskBoardPerson,
  TaskDragPayload,
} from "./TaskBoard.types";

interface TaskCardProps {
  task: Task;
  project?: TaskBoardProject;
  assignee?: TaskBoardPerson;
  isDraggable?: boolean;
  /** False hides Start, Raise blocker and Submit (the assignee's own actions). */
  memberActionsAllowed?: boolean;
  onTaskClick?: (taskId: string) => void;
  onStatusChange?: (targetStatus: TaskStatus) => void;
  onActionRequired?: (action: {
    kind: "blocker" | "clear" | "submit" | "accept" | "return" | "cancel" | "start" | "reschedule";
    taskId: string;
    blockerId?: string;
  }) => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>, task: Task) => void;
  onDragEnd?: (e: DragEvent<HTMLDivElement>) => void;
}

const complexityConfig = {
  low: { label: "Low", color: "teal", weight: 1 },
  mid: { label: "Mid", color: "blue", weight: 2 },
  high: { label: "High", color: "red", weight: 3 },
} as const;

export function TaskCard({
  task,
  project,
  assignee,
  isDraggable = true,
  memberActionsAllowed = true,
  onTaskClick,
  onStatusChange,
  onActionRequired,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue =
    task.dueDate < todayStr &&
    task.status !== "accepted" &&
    task.status !== "cancelled";
  const isDueToday = task.dueDate === todayStr;

  const complexity = complexityConfig[task.complexity] ?? complexityConfig.mid;

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const payload: TaskDragPayload = {
      type: "task",
      taskId: task.id,
      sourceStatus: task.status,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
    if (onDragStart) {
      onDragStart(e, task);
    }
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <Card
      withBorder
      shadow={isDragging ? "lg" : "xs"}
      radius="md"
      p="sm"
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        cursor: isDraggable ? "grab" : "default",
        opacity: isDragging ? 0.45 : 1,
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        borderColor: task.activeBlockerId
          ? "var(--mantine-color-red-6)"
          : undefined,
        backgroundColor: "var(--mantine-color-body)",
      }}
    >
      <Stack gap="xs">
        {/* Top Badges Row */}
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Group gap={6} wrap="nowrap" style={{ overflow: "hidden" }}>
            {isDraggable && (
              <IconGripVertical
                size={14}
                style={{
                  color: "var(--mantine-color-dimmed)",
                  flexShrink: 0,
                  cursor: "grab",
                }}
              />
            )}
            {project && (
              <Badge
                size="xs"
                variant="light"
                color="gray"
                style={{
                  maxWidth: 130,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {project.name}
              </Badge>
            )}
          </Group>

          <Group gap={6} wrap="nowrap">
            <Badge
              size="xs"
              variant="outline"
              color={complexity.color}
              leftSection={
                task.complexity === "high" ? <IconFlame size={10} /> : undefined
              }
            >
              {complexity.label} · {complexity.weight}pt
            </Badge>

            {/* Quick Action Menu */}
            <Menu position="bottom-end" shadow="md" withinPortal>
              <Menu.Target>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  aria-label={`Options for ${task.title}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDotsVertical size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Task Actions</Menu.Label>
                <Menu.Item
                  onClick={() => onTaskClick?.(task.id)}
                  leftSection={<IconArrowRight size={14} />}
                >
                  View Details
                </Menu.Item>
                {task.status === "not_started" && memberActionsAllowed && onStatusChange && (
                  <Menu.Item
                    onClick={() => onStatusChange("in_progress")}
                    leftSection={<IconArrowRight size={14} />}
                  >
                    Start Work
                  </Menu.Item>
                )}
                {task.status !== "blocked" && memberActionsAllowed && onActionRequired && (
                  <Menu.Item
                    color="red"
                    onClick={() =>
                      onActionRequired({ kind: "blocker", taskId: task.id })
                    }
                    leftSection={<IconAlertTriangle size={14} />}
                  >
                    Raise Blocker
                  </Menu.Item>
                )}
                {task.activeBlockerId && onActionRequired && (
                  <Menu.Item
                    color="teal"
                    onClick={() =>
                      onActionRequired({
                        kind: "clear",
                        taskId: task.id,
                        blockerId: task.activeBlockerId!,
                      })
                    }
                  >
                    Clear Blocker
                  </Menu.Item>
                )}
                {task.status !== "submitted" &&
                  task.status !== "accepted" &&
                  task.status !== "cancelled" &&
                  memberActionsAllowed &&
                  onActionRequired && (
                    <Menu.Item
                      onClick={() =>
                        onActionRequired({ kind: "submit", taskId: task.id })
                      }
                    >
                      Submit for Review
                    </Menu.Item>
                  )}
                {task.status === "submitted" && onActionRequired && (
                  <>
                    <Menu.Item
                      color="teal"
                      onClick={() =>
                        onActionRequired({ kind: "accept", taskId: task.id })
                      }
                    >
                      Accept Outcome
                    </Menu.Item>
                    <Menu.Item
                      color="orange"
                      onClick={() =>
                        onActionRequired({ kind: "return", taskId: task.id })
                      }
                    >
                      Return for Rework
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Task Title (Interactive button role for smoke tests & direct opening) */}
        <UnstyledButton
          role="button"
          aria-label={task.title}
          onClick={() => onTaskClick?.(task.id)}
          style={{ textAlign: "left", width: "100%" }}
        >
          <Text
            size="sm"
            fw={600}
            lineClamp={2}
            style={{
              textDecoration: task.status === "cancelled" ? "line-through" : "none",
              color:
                task.status === "cancelled"
                  ? "var(--mantine-color-dimmed)"
                  : "var(--mantine-color-text)",
            }}
          >
            {task.title}
          </Text>
        </UnstyledButton>

        {/* Task Description snippet if available */}
        {task.description && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {task.description}
          </Text>
        )}

        {/* Blocker Alert Banner on Card */}
        {task.activeBlockerId && (
          <Group gap={4} wrap="nowrap" c="red.7">
            <IconAlertTriangle size={13} style={{ flexShrink: 0 }} />
            <Text size="xs" fw={500} lineClamp={1}>
              Active Blocker
            </Text>
          </Group>
        )}

        {/* Bottom Metadata: Assignee & Due Date */}
        <Group justify="space-between" align="center" mt={4} wrap="nowrap">
          <Group gap={6} wrap="nowrap">
            <Avatar
              size="xs"
              radius="xl"
              color="teal"
              name={assignee?.name ?? "Unassigned"}
            >
              {assignee ? assignee.name.slice(0, 2).toUpperCase() : "?"}
            </Avatar>
            <Text size="xs" c="dimmed" maw={100} truncate="end">
              {assignee?.name ?? "Unassigned"}
            </Text>
          </Group>

          <Tooltip
            label={
              isOverdue
                ? "Overdue deadline"
                : isDueToday
                  ? "Due today"
                  : `Due on ${task.dueDate}`
            }
            withArrow
          >
            <Group
              gap={4}
              wrap="nowrap"
              c={
                isOverdue
                  ? "red.7"
                  : isDueToday
                    ? "orange.7"
                    : "dimmed"
              }
            >
              <IconCalendar size={13} style={{ flexShrink: 0 }} />
              <Text size="xs" fw={isOverdue || isDueToday ? 600 : 400}>
                {task.dueDate}
              </Text>
            </Group>
          </Tooltip>
        </Group>
      </Stack>
    </Card>
  );
}
