import { useSignals } from "./use-signals";
import type { Task } from "../../entities/task.entity";

export interface MemberTaskFlags {
  overdue: boolean;
  dueSoon: boolean;
  stale: boolean;
}

/**
 * IC-first warnings (FR-04, SR-08, SR-09, SR-19): the same derived signals
 * managers and admins see, surfaced on the assignee's own screen.
 */
export function useMemberTaskFlags(personId: string, date: string) {
  const { data: signals } = useSignals(date);
  const summary = signals?.memberSummaries[personId];
  const dueSoonIds = new Set(summary?.imminentTasks.map((task) => task.id));
  const staleIds = new Set(summary?.staleTaskIds);

  return (task: Task): MemberTaskFlags => {
    const open = task.status !== "accepted" && task.status !== "cancelled";
    return {
      overdue: open && task.dueDate < date,
      dueSoon: open && dueSoonIds.has(task.id),
      stale: open && staleIds.has(task.id),
    };
  };
}
