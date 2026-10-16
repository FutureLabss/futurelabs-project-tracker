import dayjs from "dayjs";

/** Today's date in the browser's time zone, as YYYY-MM-DD. */
export const todayIso = () => dayjs().format("YYYY-MM-DD");

export const PAST_DUE_DATE_MESSAGE = "The due date cannot be in the past.";

/** Rescheduling records a schedule slip, so it only applies to work someone owns. */
export const UNASSIGNED_RESCHEDULE_MESSAGE = "Assign an owner before rescheduling this task.";

/** A task's due date may be today or later, never in the past (create and reschedule). */
export const isPastDueDate = (dueDate: string, today: string = todayIso()) =>
  !!dueDate && dueDate < today;
