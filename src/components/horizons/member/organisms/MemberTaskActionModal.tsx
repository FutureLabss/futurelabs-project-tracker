import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useSubmitTask } from "../../../../api/hooks/use-tasks";
import {
  useRaiseBlocker,
  useClearBlocker,
} from "../../../../api/hooks/use-blockers";
import { usePersons } from "../../../../api/hooks/use-availability";
import type { BlockerCategory } from "../../../../entities/blocker.entity";
import { BlockingTaskSelect } from "../molecules/BlockingTaskSelect";

export type MemberTaskAction =
  | { kind: "submit"; taskId: string; taskTitle?: string }
  | { kind: "blocker"; taskId: string; taskTitle?: string }
  | { kind: "clear"; taskId: string; blockerId: string; taskTitle?: string };

interface MemberTaskActionModalProps {
  action: MemberTaskAction | null;
  actorId: string;
  onClose: () => void;
}

export function MemberTaskActionModal({
  action,
  actorId,
  onClose,
}: MemberTaskActionModalProps) {
  const submitTaskMutation = useSubmitTask();
  const raiseBlockerMutation = useRaiseBlocker();
  const clearBlockerMutation = useClearBlocker();

  const [notes, setNotes] = useState("");
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [blockerCategory, setBlockerCategory] =
    useState<BlockerCategory>("unclear_requirement");
  const [blockerReason, setBlockerReason] = useState("");
  const [blockerOwnerId, setBlockerOwnerId] = useState<string | null>(null);
  const [blockingTaskId, setBlockingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: persons = [] } = usePersons();

  if (!action) return null;

  const resetAndClose = () => {
    setNotes("");
    setDeliverableUrl("");
    setBlockerCategory("unclear_requirement");
    setBlockerReason("");
    setBlockerOwnerId(null);
    setBlockingTaskId(null);
    setError(null);
    onClose();
  };

  const isSubmitting =
    submitTaskMutation.isPending ||
    raiseBlockerMutation.isPending ||
    clearBlockerMutation.isPending;

  const handleSubmit = async () => {
    setError(null);
    try {
      if (action.kind === "submit") {
        await submitTaskMutation.mutateAsync({
          taskId: action.taskId,
          actorId,
          notes: notes || undefined,
          deliverableUrl: deliverableUrl || undefined,
        });
      } else if (action.kind === "blocker") {
        if (!blockerOwnerId) {
          setError("Please choose who can clear this blocker.");
          return;
        }
        if (!blockerReason.trim()) {
          setError("Please provide a reason for the blocker.");
          return;
        }
        await raiseBlockerMutation.mutateAsync({
          taskId: action.taskId,
          ownerId: blockerOwnerId,
          category: blockerCategory,
          description: blockerReason,
          blockingTaskId: blockingTaskId ?? undefined,
          actorId,
        });
      } else if (action.kind === "clear") {
        await clearBlockerMutation.mutateAsync({
          blockerId: action.blockerId,
          actorId,
        });
      }
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const getTitle = () => {
    if (action.kind === "submit") return "Submit Deliverable for Review";
    if (action.kind === "blocker") return "Raise Blocker";
    if (action.kind === "clear") return "Clear Active Blocker";
    return "Task Action";
  };

  return (
    <Modal
      opened={!!action}
      onClose={resetAndClose}
      title={getTitle()}
      centered
      size="md"
    >
      <Stack gap="sm">
        {action.taskTitle && (
          <Text size="sm" c="dimmed">
            Task: <Text span fw={600} c="var(--mantine-color-text)">{action.taskTitle}</Text>
          </Text>
        )}

        {action.kind === "submit" && (
          <>
            <TextInput
              label="Deliverable Link"
              placeholder="https://github.com/... or Figma link"
              value={deliverableUrl}
              onChange={(e) => setDeliverableUrl(e.currentTarget.value)}
            />
            <Textarea
              label="Submission Notes"
              placeholder="Summary of outcome, verification steps, or test results..."
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
            />
          </>
        )}

        {action.kind === "blocker" && (
          <>
            <Select
              label="Blocker Category"
              value={blockerCategory}
              onChange={(v) =>
                setBlockerCategory((v as BlockerCategory) ?? "unclear_requirement")
              }
              data={[
                { value: "unclear_requirement", label: "Unclear Requirement" },
                { value: "decision", label: "Pending Decision" },
                { value: "person", label: "Person / Ownership" },
                { value: "external", label: "External Dependency" },
              ]}
              required
            />
            <Select
              label="Who can clear it?"
              description="The person with authority to remove this blocker"
              placeholder="Select a person"
              data={persons.map((p) => ({ value: p.id, label: `${p.name} (${p.role})` }))}
              value={blockerOwnerId}
              onChange={setBlockerOwnerId}
              searchable
              required
            />
            <BlockingTaskSelect
              taskId={action.taskId}
              value={blockingTaskId}
              onChange={setBlockingTaskId}
              onOwnerSuggested={(ownerId) => ownerId && setBlockerOwnerId(ownerId)}
            />
            <Textarea
              label="Blocker Reason & Impact"
              placeholder="What is preventing forward progress on this task?"
              minRows={3}
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.currentTarget.value)}
              required
            />
          </>
        )}

        {action.kind === "clear" && (
          <Text size="sm">
            Are you sure you want to clear the active blocker on this task and resume progress?
          </Text>
        )}

        {error && (
          <Text size="xs" c="red">
            {error}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={resetAndClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            color={action.kind === "blocker" ? "red" : "teal"}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {action.kind === "submit"
              ? "Submit for Review"
              : action.kind === "blocker"
                ? "Raise Blocker"
                : "Clear Blocker"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
