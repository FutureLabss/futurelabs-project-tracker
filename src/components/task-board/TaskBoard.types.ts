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
  /**
   * Whether the viewer may do the assignee's part on a task (start, submit,
   * raise a blocker). Omit to allow everywhere; admins pass "own tasks only".
   */
  canDoMemberActions?: (task: Task) => boolean;
  /** The dashboard date (YYYY-MM-DD) for overdue / due-today; defaults to the local date. */
  today?: string;
  readOnly?: boolean;
  emptyPlaceholder?: ReactNode;
  headerRightContent?: ReactNode;
  storageKey?: string; // For persisting column order
}
