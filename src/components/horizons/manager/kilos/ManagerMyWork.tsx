import { useState } from "react";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { TaskBoard } from "../../../task-board";
import type { Person } from "../../../../entities/person.entity";
import type { Project } from "../../../../entities/project.entity";
import type { Task, TaskStatus } from "../../../../entities/task.entity";
import {
  MemberTaskActionModal,
  type MemberTaskAction,
} from "../../member/organisms/MemberTaskActionModal";

interface ManagerMyWorkProps {
  /** Every task assigned to the manager, in any project (FR-50 allows their own tasks). */
  tasks: Task[];
  projects: Project[];
  people: Person[];
  actorId: string;
  date: string;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
  onCreateTask: () => void;
  /** Refreshes the manager workspace after an action dialog saves. */
  onActionSaved: () => void;
}

/** "A Manager is a Member in respect of tasks assigned to them": the manager's own queue. */
export function ManagerMyWork({
  tasks,
  projects,
  people,
  actorId,
  date,
  onTaskClick,
  onStatusChange,
  onCreateTask,
  onActionSaved,
}: ManagerMyWorkProps) {
  const [action, setAction] = useState<MemberTaskAction | null>(null);

  const openTasks = tasks
    .filter((t) => t.assigneeId === actorId && t.status !== "accepted" && t.status !== "cancelled")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <Paper withBorder radius="md" p="md" bg="white">
      <Stack gap="md">
        <Stack gap={2}>
          <Group gap="xs">
            <IconUser size={20} color="#20c997" />
            <Text size="md" fw={700}>
              My Work ({openTasks.length})
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Tasks assigned to you, earliest due date first. Here you work on them like any team member.
          </Text>
        </Stack>

        <TaskBoard
          tasks={openTasks}
          projects={projects}
          people={people}
          onTaskClick={onTaskClick}
          today={date}
          onTaskStatusChange={(taskId, status) => onStatusChange(taskId, status)}
          onTaskActionRequired={(request) => {
            const title = openTasks.find((t) => t.id === request.taskId)?.title;
            if (request.kind === "blocker" || request.kind === "submit") {
              setAction({ kind: request.kind, taskId: request.taskId, taskTitle: title });
            } else if (request.kind === "clear" && request.blockerId) {
              setAction({ kind: "clear", taskId: request.taskId, blockerId: request.blockerId, taskTitle: title });
            }
          }}
          onCreateTask={onCreateTask}
          storageKey="futurelabs_manager_my_work_cols_v1"
        />
      </Stack>

      <MemberTaskActionModal
        action={action}
        actorId={actorId}
        onClose={() => {
          setAction(null);
          onActionSaved();
        }}
      />
    </Paper>
  );
}
