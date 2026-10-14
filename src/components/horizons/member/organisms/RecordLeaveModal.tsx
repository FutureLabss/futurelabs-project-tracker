import { Alert, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import dayjs from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { useRecordLeave } from "../../../../api/hooks/use-availability";
import { ReusableModal } from "../../../modal/ReuseableModal";

type RecordLeaveFormValues = {
  fromDate: Date | null;
  toDate: Date | null;
  leaveReason: string;
};

type RecordLeaveModalProps = {
  opened: boolean;
  onClose: () => void;
  personId: string;
};

export function RecordLeaveModal({
  opened,
  onClose,
  personId,
}: RecordLeaveModalProps) {
  const mutation = useRecordLeave();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<RecordLeaveFormValues>({
    mode: "onChange",
    defaultValues: {
      fromDate: null,
      toDate: null,
      leaveReason: "",
    },
  });

  const handleRecordLeave = async (values: RecordLeaveFormValues) => {
    if (!values.fromDate || !values.toDate) return;

    await mutation.mutateAsync({
      personId,
      fromDate: dayjs(values.fromDate).format("YYYY-MM-DD"),
      toDate: dayjs(values.toDate).format("YYYY-MM-DD"),
      note: values.leaveReason.trim(),
      actorId: personId,
    });
    reset();
    onClose();
  };

  const handleCancel = () => {
    if (mutation.isPending) return;
    reset();
    mutation.reset();
    onClose();
  };

  return (
    <ReusableModal
      opened={opened}
      onClose={handleCancel}
      title="Record Leave / Unavailability"
      size={440}
      submitLabel="Record Leave"
      submitDisabled={!isValid || mutation.isPending}
      onSubmit={handleSubmit(handleRecordLeave)}
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          Recorded leave automatically suppresses staleness and inactivity
          alerts during the absence period.
        </Text>

        {mutation.error && (
          <Alert color="red" role="alert">
            {mutation.error.message}
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Controller
            name="fromDate"
            control={control}
            rules={{ required: "From date is required" }}
            render={({ field, fieldState }) => (
              <DateInput
                label="From Date"
                withAsterisk
                valueFormat="YYYY-MM-DD"
                placeholder="YYYY-MM-DD"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="toDate"
            control={control}
            rules={{ required: "To date is required" }}
            render={({ field, fieldState }) => (
              <DateInput
                label="To Date"
                withAsterisk
                valueFormat="YYYY-MM-DD"
                placeholder="YYYY-MM-DD"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </SimpleGrid>

        <Controller
          name="leaveReason"
          control={control}
          rules={{ required: "Leave reason is required" }}
          render={({ field, fieldState }) => (
            <TextInput
              label="Leave Note / Reason"
              withAsterisk
              placeholder="e.g. Annual leave"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </Stack>
    </ReusableModal>
  );
}
