import { Badge, Modal, Stack, Text } from "@mantine/core";
import type { LedgerRecord } from "../../../../entities/ledger-record.entity";
import { readable } from "../admin-utils";

interface LedgerRecordModalProps {
  record: LedgerRecord | null;
  onClose: () => void;
  personName: (id: string | null) => string;
}

export function LedgerRecordModal({
  record,
  onClose,
  personName,
}: LedgerRecordModalProps) {
  return (
    <Modal
      opened={!!record}
      onClose={onClose}
      title="Recorded change"
      centered
    >
      {record && (
        <Stack>
          <Badge>{readable(record.type)}</Badge>
          <Text>Actor: {personName(record.actorId)}</Text>
          <Text size="sm">
            {new Date(record.occurredAt).toLocaleString()}
          </Text>
          <Text size="sm">
            Subject: {record.subjectType} · {record.subjectId}
          </Text>
          <Text>From: {record.fromValue ?? "—"}</Text>
          <Text>To: {record.toValue ?? "—"}</Text>
          <Text>Reason: {record.reason || "No reason recorded."}</Text>
          <Text size="xs" c="dimmed">
            This is an immutable audit entry.
          </Text>
        </Stack>
      )}
    </Modal>
  );
}
