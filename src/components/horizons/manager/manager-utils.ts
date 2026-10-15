import type { Task } from "../../../entities/task.entity";

export function getManagerReviewQueue(tasks: Task[] = []) {
  return tasks.filter((task) => task.status === "submitted");
}
