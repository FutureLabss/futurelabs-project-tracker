import type { TaskBoardColumn as ColumnType } from "./TaskBoard.types";

export const DEFAULT_TASK_BOARD_COLUMNS: ColumnType[] = [
  {
    id: "not_started",
    title: "Not Started",
    color: "gray",
    description: "Tasks awaiting kickoff",
  },
  {
    id: "in_progress",
    title: "In Progress",
    color: "blue",
    description: "Currently being worked on",
  },
  {
    id: "blocked",
    title: "Blocked",
    color: "red",
    description: "Impediments requiring resolution",
  },
  {
    id: "submitted",
    title: "In Review",
    color: "orange",
    description: "Submitted deliverables awaiting verification",
  },
  {
    id: "accepted",
    title: "Accepted",
    color: "teal",
    description: "Finished & verified outcomes",
  },
];
