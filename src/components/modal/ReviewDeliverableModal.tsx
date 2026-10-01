import { useEffect, useState } from "react";
import {
  Modal,
  Stack,
  Text,
  Textarea,
  Button,
  Group,
  Paper,
  Badge,
} from "@mantine/core";
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
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);

  useEffect(() => {
    setNote("");
    setReturnConfirmOpen(false);
  }, [deliverable?.id]);

  if (!deliverable) return null;

  return (
    <>
      <Modal
        opened={!returnConfirmOpen}
        onClose={onClose}
        title="Review Deliverable"
        centered
        size="lg"
        closeOnClickOutside={false}
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={700} size="lg" c="dark.9">
                {deliverable.title}
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                {deliverable.description || "No description provided."}
              </Text>
            </div>
            <Badge color="violet" variant="light">
              {deliverable.complexity.toUpperCase()} COMPLEXITY
            </Badge>
          </Group>

          <Paper withBorder p="sm" radius="sm">
            <Group grow align="flex-start">
              <div>
                <Text size="xs" c="dimmed">
                  PROJECT
                </Text>
                <Text size="sm" fw={600}>
                  {deliverable.projectName}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  SUBMITTED BY
                </Text>
                <Text size="sm" fw={600}>
                  {deliverable.submittedByName}
                </Text>
              </div>
            </Group>
          </Paper>

          <Textarea
            label="Verification Note / Justification"
            placeholder="Record verification proof or required rework..."
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            minRows={3}
            required
          />

          <Group justify="space-between" mt="xs">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Group gap="sm">
              <Button
                color="red"
                variant="light"
                disabled={!note.trim() || loading}
                onClick={() => setReturnConfirmOpen(true)}
              >
                Return For Work
              </Button>
              <Button
                color="teal"
                loading={loading}
                disabled={!note.trim()}
                onClick={() => void onAccept(deliverable, note.trim())}
              >
                Accept Deliverable
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={returnConfirmOpen}
        onClose={() => setReturnConfirmOpen(false)}
        title="Return Deliverable For Work"
        centered
        size="md"
        closeOnClickOutside={false}
      >
        <Stack gap="md">
          <Text size="sm" c="dark.7">
            Confirm returning{" "}
            <Text component="span" fw={700}>
              {deliverable.title}
            </Text>{" "}
            to its assignee for rework. This will remove it from the Acceptance
            Gate and record the reason in the audit ledger.
          </Text>
          <Paper withBorder p="sm" radius="sm" bg="gray.0">
            <Text size="xs" fw={700} c="dimmed" mb={4}>
              RETURN REASON
            </Text>
            <Text size="sm">{note}</Text>
          </Paper>
          <Group justify="flex-end" mt="xs">
            <Button
              variant="default"
              onClick={() => setReturnConfirmOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={loading}
              onClick={() => void onReturn(deliverable, note.trim())}
            >
              Confirm Return For Work
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
