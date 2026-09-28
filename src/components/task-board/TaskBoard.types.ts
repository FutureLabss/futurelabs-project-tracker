import type { ReactNode } from "react";
import type { Task, TaskStatus } from "../../entities/task.entity";

export interface TaskBoardColumn {
  id: TaskStatus;
  title: string;
  color: string; // Mantine theme color: "gray", "blue", "orange", "grape", "teal", "red"
  description?: string;
  badgeVariant?: "light" | "filled" | "outline";
}

export interface TaskDragPayload {
  type: "task";
  taskId: string;
  sourceStatus: TaskStatus;
}

export interface ColumnDragPayload {
  type: "column";
  columnId: TaskStatus;
  index: number;
}

export type DragPayload = TaskDragPayload | ColumnDragPayload;

export interface TaskBoardProject {
  id: string;
  name: string;
  status?: string;
}

export interface TaskBoardPerson {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface TaskBoardProps {
  tasks: Task[];
  projects?: TaskBoardProject[];
  people?: TaskBoardPerson[];
  columns?: TaskBoardColumn[];
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
  onCreateTask?: (initialStatus?: TaskStatus) => void;
  canDragTask?: (task: Task) => boolean;
  canDropTask?: (task: Task, targetStatus: TaskStatus) => boolean;
  readOnly?: boolean;
  emptyPlaceholder?: ReactNode;
  headerRightContent?: ReactNode;
  storageKey?: string; // For persisting column order
}
