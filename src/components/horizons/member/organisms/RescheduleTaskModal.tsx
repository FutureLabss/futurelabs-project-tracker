import { Alert, Text, TextInput, Textarea } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { ReusableModal } from "../../../modal/ReuseableModal";
import { useRescheduleTask } from "../../../../api/hooks/use-tasks";

interface RescheduleTaskModalProps {
  opened: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  actorId: string;
  currentDueDate?: string;
}

export function RescheduleTaskModal({
  opened,
  onClose,
  taskId,
  taskTitle,
  actorId,
  currentDueDate,
}: RescheduleTaskModalProps) {
  const [newDueDate, setNewDueDate] = useState(currentDueDate || "");
  const [reason, setReason] = useState("");

  const { mutate: rescheduleTask, isPending } = useRescheduleTask();

  const handleReschedule = () => {
    if (!newDueDate || !reason.trim()) return;

    rescheduleTask(
      {
        taskId,
        newDueDate,
        reason,
        actorId,
      },
      {
        onSuccess: () => {
          setNewDueDate("");
          setReason("");
          onClose();
        },
      }
    );
  };

  const isSubmitDisabled = !newDueDate || !reason.trim();
  const showReasonError = reason.length > 0 && reason.trim() === "";

  return (
    <ReusableModal
      opened={opened}
      onClose={onClose}
      title="Reschedule Task Due Date"
      submitLabel="Confirm Reschedule"
      onSubmit={handleReschedule}
      loading={isPending}
      submitDisabled={isSubmitDisabled}
    >
      <Text size="sm" mb="md">
        Task: <strong>{taskTitle}</strong>
      </Text>

      <Alert
        color="orange"
        title="Mandatory Audit Policy"
        icon={<IconAlertCircle size={16} />}
        mb="md"
        variant="light"
      >
        All due date revisions are permanently recorded to the immutable ledger. A clear, recorded justification is strictly mandatory.
      </Alert>

      <TextInput
        type="date"
        label="New Due Date"
        withAsterisk
        value={newDueDate}
        onChange={(e) => setNewDueDate(e.currentTarget.value)}
        mb="md"
      />

      <Textarea
        label="Justification / Reason for Slip"
        placeholder="Explain the technical or scope cause for adjusting this deadline..."
        withAsterisk
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value)}
        minRows={3}
        error={showReasonError || (reason.length === 0 && !isSubmitDisabled) ? "Reason is strictly required" : null}
      />
    </ReusableModal>
  );
}
