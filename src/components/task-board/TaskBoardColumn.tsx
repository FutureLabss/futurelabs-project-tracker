import { useState, type DragEvent } from "react";
import {
  Paper,
  Group,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Tooltip,
  Box,
} from "@mantine/core";
import {
  IconGripVertical,
  IconPlus,
  IconInbox,
} from "@tabler/icons-react";
import type { Task, TaskStatus } from "../../entities/task.entity";
import type {
  TaskBoardColumn as ColumnType,
  TaskBoardProject,
  TaskBoardPerson,
  ColumnDragPayload,
  TaskDragPayload,
} from "./TaskBoard.types";
import { TaskCard } from "./TaskCard";

interface TaskBoardColumnProps {
  column: ColumnType;
  columnIndex: number;
  tasks: Task[];
  projects?: TaskBoardProject[];
  people?: TaskBoardPerson[];
  isDraggableColumn?: boolean;
  canDragTask?: (task: Task) => boolean;
  canDoMemberActions?: (task: Task) => boolean;
  today?: string;
  readOnly?: boolean;
  onTaskClick?: (taskId: string) => void;
  onTaskStatusChange?: (
    taskId: string,
    targetStatus: TaskStatus,
    task: Task,
  ) => Promise<void> | void;
  onTaskActionRequired?: (action: {
    kind: "blocker" | "clear" | "submit" | "accept" | "return" | "cancel" | "start" | "reschedule";
    taskId: string;
    blockerId?: string;
  }) => void;
  onCreateTask?: (status?: TaskStatus) => void;
  onColumnDragStart?: (e: DragEvent<HTMLDivElement>, columnIndex: number) => void;
  onColumnDrop?: (e: DragEvent<HTMLDivElement>, targetIndex: number) => void;
  onTaskDrop?: (
    taskId: string,
    targetStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
}

export function TaskBoardColumn({
  column,
  columnIndex,
  tasks,
  projects,
  people,
  isDraggableColumn = true,
  canDragTask,
  canDoMemberActions,
  today,
  readOnly = false,
  onTaskClick,
  onTaskStatusChange,
  onTaskActionRequired,
  onCreateTask,
  onColumnDragStart,
  onColumnDrop,
  onTaskDrop,
}: TaskBoardColumnProps) {
  const [isColumnDragging, setIsColumnDragging] = useState(false);
  const [isTaskDragOver, setIsTaskDragOver] = useState(false);
  const [isColumnDragOver, setIsColumnDragOver] = useState(false);

  // Compute total points in this column
  const totalPoints = tasks.reduce((sum, t) => {
    const weight = t.complexity === "high" ? 3 : t.complexity === "mid" ? 2 : 1;
    return sum + weight;
  }, 0);

  const projectMap = new Map(projects?.map((p) => [p.id, p]));
  const peopleMap = new Map(people?.map((p) => [p.id, p]));

  // Dragging the column itself
  const handleColumnDragStart = (e: DragEvent<HTMLDivElement>) => {
    setIsColumnDragging(true);
    const payload: ColumnDragPayload = {
      type: "column",
      columnId: column.id,
      index: columnIndex,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
    onColumnDragStart?.(e, columnIndex);
  };

  const handleColumnDragEnd = () => {
    setIsColumnDragging(false);
  };

  // Drag over handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Check what is being dragged
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        const payload = JSON.parse(dataStr);
        if (payload.type === "column") {
          setIsColumnDragOver(true);
          setIsTaskDragOver(false);
          return;
        }
      }
    } catch {
      // ignore JSON parse error in dragover
    }
    setIsTaskDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only deactivate if leaving this column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsTaskDragOver(false);
      setIsColumnDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTaskDragOver(false);
    setIsColumnDragOver(false);

    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      const payload = JSON.parse(data);

      if (payload.type === "column") {
        onColumnDrop?.(e, columnIndex);
      } else if (payload.type === "task") {
        const taskPayload = payload as TaskDragPayload;
        onTaskDrop?.(taskPayload.taskId, column.id);
      }
    } catch (err) {
      console.error("Drop payload error:", err);
    }
  };

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: 320,
        minWidth: 300,
        maxWidth: 360,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: isTaskDragOver
          ? "var(--mantine-color-teal-light)"
          : isColumnDragOver
            ? "var(--mantine-color-blue-light)"
            : "var(--mantine-color-gray-light)",
        borderColor: isTaskDragOver
          ? "var(--mantine-color-teal-filled)"
          : isColumnDragOver
            ? "var(--mantine-color-blue-filled)"
            : undefined,
        opacity: isColumnDragging ? 0.4 : 1,
        transition: "border-color 0.15s ease, background-color 0.15s ease, opacity 0.15s ease",
        height: "100%",
        minHeight: 520,
      }}
    >
      {/* Column Header */}
      <Box
        p="xs"
        mb="xs"
        draggable={isDraggableColumn && !readOnly}
        onDragStart={handleColumnDragStart}
        onDragEnd={handleColumnDragEnd}
        style={{
          cursor: isDraggableColumn && !readOnly ? "grab" : "default",
          borderRadius: "var(--mantine-radius-sm)",
          userSelect: "none",
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap={8} wrap="nowrap">
            {isDraggableColumn && !readOnly && (
              <Tooltip label="Drag to reorder column" withArrow>
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  c="dimmed"
                  style={{ cursor: "grab" }}
                >
                  <IconGripVertical size={14} />
                </ActionIcon>
              </Tooltip>
            )}

            <Badge
              size="sm"
              variant={column.badgeVariant ?? "filled"}
              color={column.color}
              radius="sm"
            >
              {column.title}
            </Badge>

            <Badge size="xs" variant="light" color="gray" radius="xl">
              {tasks.length}
            </Badge>
          </Group>

          <Group gap={4} wrap="nowrap">
            {totalPoints > 0 && (
              <Tooltip label="Total complexity points in lane" withArrow>
                <Text size="xs" c="dimmed" fw={500}>
                  {totalPoints} pts
                </Text>
              </Tooltip>
            )}

            {!readOnly && onCreateTask && (
              <Tooltip label={`Add task to ${column.title}`} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => onCreateTask(column.id)}
                  aria-label={`Add task to ${column.title}`}
                >
                  <IconPlus size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Box>

      {/* Task Cards Container */}
      <Stack
        gap="xs"
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 120,
          padding: "2px",
        }}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            project={projectMap.get(task.projectId)}
            assignee={task.assigneeId ? peopleMap.get(task.assigneeId) : undefined}
            isDraggable={!readOnly && (!canDragTask || canDragTask(task))}
            memberActionsAllowed={!canDoMemberActions || canDoMemberActions(task)}
            today={today}
            onTaskClick={onTaskClick}
            onStatusChange={(targetStatus) =>
              onTaskStatusChange?.(task.id, targetStatus, task)
            }
            onActionRequired={onTaskActionRequired}
          />
        ))}

        {tasks.length === 0 && (
          <Paper
            p="md"
            withBorder
            style={{
              borderStyle: "dashed",
              borderColor: "var(--mantine-color-gray-4)",
              backgroundColor: "transparent",
              textAlign: "center",
              marginTop: "auto",
              marginBottom: "auto",
            }}
          >
            <Stack align="center" gap={6}>
              <IconInbox size={22} style={{ color: "var(--mantine-color-dimmed)" }} />
              <Text size="xs" c="dimmed">
                No tasks in this lane
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
}
