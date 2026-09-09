import { TaskComplexity, TaskOrigin } from "../entities/task.entity";

export interface CreateTaskDto {
  projectId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  complexity: TaskComplexity;
  origin: TaskOrigin;
  dueDate: string; // ISO YYYY-MM-DD
  actorId: string;
}
