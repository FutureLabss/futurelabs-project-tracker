import { Modal, Stack, Text, TextInput, Textarea, Button, Group, Alert, Box } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useForm, Controller } from "react-hook-form";

export interface RescheduleTaskFormValues {
  newDueDate: string;
  reason: string;
}

interface RescheduleTaskModalProps {
  opened: boolean;
  onClose: () => void;
  taskTitle: string;
  currentDueDate: string;
  onSubmit: (values: RescheduleTaskFormValues) => Promise<void>;
  loading?: boolean;
}

export function RescheduleTaskModal({
  opened,
  onClose,
  taskTitle,
  currentDueDate,
  onSubmit,
  loading = false,
}: RescheduleTaskModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RescheduleTaskFormValues>({
    defaultValues: {
      newDueDate: currentDueDate || new Date().toISOString().slice(0, 10),
      reason: "",
    },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset();
    onClose();
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="md">
          Reschedule Task Due Date
        </Text>
      }
      centered
      size="md"
    >
      <form onSubmit={handleFormSubmit}>
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Task: <Text component="span" fw={700} c="dark.9">{taskTitle}</Text>
          </Text>

          {/* Mandatory Policy Banner */}
          <Alert
            icon={<IconInfoCircle size={16} />}
            color="yellow"
            variant="light"
            title="Mandatory Audit Policy"
            styles={{
              root: { border: "1px solid #ffe066" },
              title: { fontWeight: 700, fontSize: 13 },
              message: { fontSize: 12 },
            }}
          >
            All due date revisions are permanently recorded to the immutable ledger. A clear, recorded justification is strictly mandatory.
          </Alert>

          <Controller
            name="newDueDate"
            control={control}
            rules={{ required: "New due date is required" }}
            render={({ field }) => (
              <TextInput
                label="New Due Date *"
                type="date"
                error={errors.newDueDate?.message}
                required
                {...field}
              />
            )}
          />

          <Controller
            name="reason"
            control={control}
            rules={{ required: "Reason is strictly required" }}
            render={({ field }) => (
              <Textarea
                label="Justification / Reason for Slip *"
                placeholder="Explain the technical or scope cause for adjusting this deadline..."
                minRows={3}
                error={errors.reason?.message}
                required
                {...field}
              />
            )}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button color="teal" type="submit" loading={loading}>
              Confirm Reschedule
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}