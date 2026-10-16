import { useState, useEffect, type DragEvent } from "react";
import {
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Box,
  ScrollArea,
} from "@mantine/core";
import {
  IconRotate,
  IconLayoutKanban,
} from "@tabler/icons-react";
import type { Task, TaskStatus } from "../../entities/task.entity";
import type {
  TaskBoardColumn as ColumnType,
  TaskBoardProps,
} from "./TaskBoard.types";
import { DEFAULT_TASK_BOARD_COLUMNS } from "./TaskBoard.constants";
import { TaskBoardColumn } from "./TaskBoardColumn";

export function TaskBoard({
  tasks,
  projects,
  people,
  columns: customColumns,
  onTaskClick,
  onTaskStatusChange,
  onTaskActionRequired,
  onCreateTask,
  canDragTask,
  canDropTask,
  readOnly = false,
  emptyPlaceholder,
  headerRightContent,
  storageKey = "futurelabs_taskboard_columns_v1",
}: TaskBoardProps) {
  // Column ordering state
  const [columns, setColumns] = useState<ColumnType[]>(() => {
    const base = customColumns ?? DEFAULT_TASK_BOARD_COLUMNS;
    if (typeof window === "undefined") return base;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const orderIds: TaskStatus[] = JSON.parse(saved);
        const ordered: ColumnType[] = [];
        for (const id of orderIds) {
          const found = base.find((c) => c.id === id);
          if (found) ordered.push(found);
        }
        // Include any new columns not in saved order
        for (const col of base) {
          if (!ordered.some((c) => c.id === col.id)) {
            ordered.push(col);
          }
        }
        if (ordered.length === base.length) return ordered;
      }
    } catch {
      // ignore JSON parse errors
    }
    return base;
  });

  // Keep columns updated if customColumns prop changes
  useEffect(() => {
    if (customColumns) {
      setColumns(customColumns);
    }
  }, [customColumns]);

  // Persist column order
  const persistColumnOrder = (newCols: ColumnType[]) => {
    setColumns(newCols);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(newCols.map((c) => c.id)),
      );
    } catch {
      // localStorage error handling
    }
  };

  const resetColumnOrder = () => {
    const base = customColumns ?? DEFAULT_TASK_BOARD_COLUMNS;
    setColumns(base);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  // Drag-and-drop reorder for columns
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(
    null,
  );

  const handleColumnDragStart = (
    _e: DragEvent<HTMLDivElement>,
    columnIndex: number,
  ) => {
    setDraggedColumnIndex(columnIndex);
  };

  const handleColumnDrop = (
    _e: DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    if (draggedColumnIndex === null || draggedColumnIndex === targetIndex) {
      setDraggedColumnIndex(null);
      return;
    }
    const updated = [...columns];
    const [moved] = updated.splice(draggedColumnIndex, 1);
    updated.splice(targetIndex, 0, moved);
    persistColumnOrder(updated);
    setDraggedColumnIndex(null);
  };

  // Drag-and-drop for task cards
  const handleTaskDrop = (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return; // Same column, no status change needed

    if (canDropTask && !canDropTask(task, targetStatus)) {
      return;
    }

    // Determine whether this status transition requires a dedicated modal action
    // 1. Moving to "blocked": requires blocker reason & category
    if (targetStatus === "blocked") {
      if (onTaskActionRequired) {
        onTaskActionRequired({ kind: "blocker", taskId });
        return;
      }
    }

    // 2. Moving from "blocked" to open status: requires clearing active blocker
    if (
      task.status === "blocked" &&
      task.activeBlockerId &&
      (targetStatus === "in_progress" || targetStatus === "not_started")
    ) {
      if (onTaskActionRequired) {
        onTaskActionRequired({
          kind: "clear",
          taskId,
          blockerId: task.activeBlockerId,
        });
        return;
      }
    }

    // 3. Moving to "submitted": requires deliverable link / submission notes
    if (targetStatus === "submitted") {
      if (onTaskActionRequired) {
        onTaskActionRequired({ kind: "submit", taskId });
        return;
      }
    }

    // 4. Moving to "accepted": requires work to have been submitted
    if (targetStatus === "accepted") {
      if (task.status === "submitted" && onTaskActionRequired) {
        onTaskActionRequired({ kind: "accept", taskId });
        return;
      }
      if (task.status !== "submitted") {
        // If not submitted yet, route to submit dialog first
        if (onTaskActionRequired) {
          onTaskActionRequired({ kind: "submit", taskId });
          return;
        }
      }
    }

    // 5. Moving from "submitted" back to "in_progress": return requires rework reason
    if (task.status === "submitted" && targetStatus === "in_progress") {
      if (onTaskActionRequired) {
        onTaskActionRequired({ kind: "return", taskId });
        return;
      }
    }

    // 6. Direct status transition (e.g. not_started <-> in_progress)
    onTaskStatusChange?.(taskId, targetStatus, task);
  };

  // Group tasks by status
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    not_started: [],
    in_progress: [],
    blocked: [],
    submitted: [],
    accepted: [],
    cancelled: [],
  };

  for (const t of tasks) {
    if (tasksByStatus[t.status]) {
      tasksByStatus[t.status].push(t);
    }
  }

  // Summary counts
  const totalTasks = tasks.length;
  const activeCount =
    (tasksByStatus.in_progress?.length ?? 0) +
    (tasksByStatus.not_started?.length ?? 0);

  return (
    <Box>
      {/* Board Utility Bar */}
      <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="xs">
        <Group gap="xs" wrap="nowrap">
          <Group gap={6} wrap="nowrap">
            <IconLayoutKanban size={18} style={{ color: "var(--mantine-color-teal-filled)" }} />
            <Text fw={600} size="sm">
              Board Overview
            </Text>
          </Group>
          <Badge size="sm" variant="light" color="teal">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </Badge>
          <Badge size="sm" variant="outline" color="blue">
            {activeCount} active
          </Badge>
        </Group>

        <Group gap="xs">
          <Tooltip label="Reset column arrangement to default" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={resetColumnOrder}
              aria-label="Reset column order"
            >
              <IconRotate size={15} />
            </ActionIcon>
          </Tooltip>
          {headerRightContent}
        </Group>
      </Group>

      {/* Kanban Board Container */}
      <ScrollArea type="auto" offsetScrollbars style={{ width: "100%" }}>
        <Box
          style={{
            display: "flex",
            gap: "1rem",
            paddingBottom: "1rem",
            minWidth: columns.length * 320,
            alignItems: "stretch",
          }}
        >
          {columns.map((col, index) => (
            <TaskBoardColumn
              key={col.id}
              column={col}
              columnIndex={index}
              tasks={tasksByStatus[col.id] ?? []}
              projects={projects}
              people={people}
              isDraggableColumn={!readOnly}
              canDragTask={canDragTask}
              readOnly={readOnly}
              onTaskClick={onTaskClick}
              onTaskStatusChange={onTaskStatusChange}
              onTaskActionRequired={onTaskActionRequired}
              onCreateTask={onCreateTask}
              onColumnDragStart={handleColumnDragStart}
              onColumnDrop={handleColumnDrop}
              onTaskDrop={handleTaskDrop}
            />
          ))}
        </Box>
      </ScrollArea>

      {totalTasks === 0 && emptyPlaceholder}
    </Box>
  );
}
