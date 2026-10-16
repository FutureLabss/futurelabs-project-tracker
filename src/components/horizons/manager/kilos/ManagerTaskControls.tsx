import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconBan,
  IconScale,
  IconUserShare,
} from "@tabler/icons-react";
import type { Person } from "../../../../entities/person.entity";
import type { ProjectMember } from "../../../../entities/project-member.entity";
import type { Task, TaskComplexity } from "../../../../entities/task.entity";
import {
  useCancelTask,
  useChangeTaskComplexity,
  useReassignTask,
  useReopenTask,
} from "../../../../api/hooks/use-manager-actions";

type ControlAction = "reassign" | "complexity" | "cancel" | "reopen";

interface ManagerTaskControlsProps {
  task: Task;
  people: Person[];
  members: ProjectMember[];
  projectManagerId: string | null;
  actorId: string;
}

const UNASSIGNED = "__unassigned__";

/** FR-24 / FR-26 / FR-27 / FR-30: manager-only controls for a task in a managed project. */
export function ManagerTaskControls({
  task,
  people,
  members,
  projectManagerId,
  actorId,
}: ManagerTaskControlsProps) {
  const [action, setAction] = useState<ControlAction | null>(null);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<TaskComplexity>(task.complexity);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reassign = useReassignTask();
  const changeComplexity = useChangeTaskComplexity();
  const cancel = useCancelTask();
  const reopen = useReopenTask();
  const pending = reassign.isPending || changeComplexity.isPending || cancel.isPending || reopen.isPending;

  if (projectManagerId !== actorId) return null;

  const isClosed = task.status === "accepted" || task.status === "cancelled";

  // People with access to the project; the database rejects anyone else.
  const memberIds = new Set(members.filter((m) => m.projectId === task.projectId).map((m) => m.personId));
  const eligible = people.filter(
    (p) =>
      p.status !== "inactive" &&
      p.role !== "admin" &&
      (memberIds.size === 0 || memberIds.has(p.id) || p.id === projectManagerId),
  );

  const open = (next: ControlAction) => {
    setAction(next);
    setError(null);
    setReason("");
    setAssignee(task.assigneeId ?? UNASSIGNED);
    setComplexity(task.complexity);
  };

  const run = async () => {
    setError(null);
    try {
      if (action === "reassign") {
        await reassign.mutateAsync({
          taskId: task.id,
          assigneeId: assignee === UNASSIGNED ? null : assignee,
          actorId,
        });
      } else if (action === "complexity") {
        await changeComplexity.mutateAsync({ taskId: task.id, complexity, actorId, reason: reason || undefined });
      } else if (action === "cancel") {
        await cancel.mutateAsync({ taskId: task.id, actorId });
      } else if (action === "reopen") {
        if (!reason.trim()) {
          setError("Give a reason for reopening this work.");
          return;
        }
        await reopen.mutateAsync({ taskId: task.id, actorId, reason });
      }
      setAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The change could not be saved.");
    }
  };

  const titles: Record<ControlAction, string> = {
    reassign: "Reassign task",
    complexity: "Change complexity",
    cancel: "Cancel task",
    reopen: "Reopen accepted task",
  };

  return (
    <>
      <Group gap="sm">
        {!isClosed && (
          <>
            <Button size="sm" variant="light" leftSection={<IconUserShare size={16} />} onClick={() => open("reassign")}>
              Reassign
            </Button>
            <Button size="sm" variant="light" leftSection={<IconScale size={16} />} onClick={() => open("complexity")}>
              Change complexity
            </Button>
            <Button size="sm" variant="light" color="red" leftSection={<IconBan size={16} />} onClick={() => open("cancel")}>
              Cancel task
            </Button>
          </>
        )}
        {task.status === "accepted" && (
          <Button size="sm" variant="light" color="orange" leftSection={<IconArrowBackUp size={16} />} onClick={() => open("reopen")}>
            Reopen
          </Button>
        )}
      </Group>

      <Modal opened={action !== null} onClose={() => setAction(null)} title={action ? titles[action] : ""} centered>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Task: <Text span fw={600} c="var(--mantine-color-text)">{task.title}</Text>
          </Text>

          {action === "reassign" && (
            <Select
              label="New assignee"
              data={[
                { value: UNASSIGNED, label: "Unassigned" },
                ...eligible.map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={assignee}
              onChange={setAssignee}
              searchable
              allowDeselect={false}
            />
          )}

          {action === "complexity" && (
            <>
              <SegmentedControl
                value={complexity}
                onChange={(value) => setComplexity(value as TaskComplexity)}
                data={[
                  { value: "low", label: "Low (1)" },
                  { value: "mid", label: "Mid (2)" },
                  { value: "high", label: "High (3)" },
                ]}
              />
              <Textarea
                label="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.currentTarget.value)}
                autosize
                minRows={2}
              />
            </>
          )}

          {action === "cancel" && (
            <Text size="sm">
              Cancelled work stays in the record but no longer counts as open work. Any open blocker on it is cleared.
            </Text>
          )}

          {action === "reopen" && (
            <Textarea
              label="Why is this being reopened?"
              required
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
              autosize
              minRows={2}
            />
          )}

          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setAction(null)} disabled={pending}>
              Back
            </Button>
            <Button
              color={action === "cancel" ? "red" : "teal"}
              loading={pending}
              disabled={action === "complexity" && complexity === task.complexity}
              onClick={run}
            >
              {action === "cancel" ? "Cancel task" : "Save"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
