import type { TaskComplexity, TaskStatus } from "../entities/task.entity";
export interface MemberTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeInitial?: string;
  assigneeRole?: string;
  project: string;
  complexity: Uppercase<TaskComplexity>;
  points: number;
  dueDate: string;
  status: Uppercase<TaskStatus> | "NOT STARTED" | "IN PROGRESS";
  overdue: boolean;
  accessMode: "INSPECT (READ-ONLY)";
}
