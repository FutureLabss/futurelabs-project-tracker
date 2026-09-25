import { useState } from "react";
import { Stack, Text, Textarea, Button, Group } from "@mantine/core";
import { ReusableModal } from "./ReuseableModal";
import type { DeliverableRow } from "../horizons/manager/kilos/AcceptanceGate";

interface ReviewDeliverableModalProps {
  deliverable: DeliverableRow | null;
  onClose: () => void;
  onAccept: (deliverable: DeliverableRow, note: string) => Promise<void>;
  onReturn: (deliverable: DeliverableRow, note: string) => Promise<void>;
  loading?: boolean;
}

export function ReviewDeliverableModal({
  deliverable,
  onClose,
  onAccept,
  onReturn,
  loading = false,
}: ReviewDeliverableModalProps) {
  const [note, setNote] = useState("");

  if (!deliverable) return null;

  return (
    <ReusableModal
      opened={!!deliverable}
      onClose={onClose}
      title={`Review Deliverable: ${deliverable.title}`}
      loading={loading}
    >
      <Stack gap="md">
        <Text size="sm">
          <strong>Project:</strong> {deliverable.projectName}
        </Text>
        <Text size="sm">
          <strong>Submitted By:</strong> {deliverable.submittedByName}
        </Text>
        <Text size="sm">
          <strong>Complexity:</strong> {deliverable.complexity}
        </Text>

        <Textarea
          label="Verification Note / Justification"
          placeholder="State verification proof or rework requirements..."
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          required
        />

        <Group justify="flex-end" mt="md">
          <Button
            color="red"
            variant="light"
            disabled={!note.trim() || loading}
            onClick={() => onReturn(deliverable, note)}
          >
            Return for Rework
          </Button>
          <Button
            color="teal"
            disabled={!note.trim() || loading}
            onClick={() => onAccept(deliverable, note)}
          >
            Accept Deliverable
          </Button>
        </Group>
      </Stack>
    </ReusableModal>
  );
}
