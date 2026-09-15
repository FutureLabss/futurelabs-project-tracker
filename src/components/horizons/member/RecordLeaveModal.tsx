import {
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';

import { DateInput } from '@mantine/dates';
import { ReusableModal } from '../../modal/ReuseableModal';
import { Controller, useForm } from 'react-hook-form';




type RecordLeaveFormValues = {
  teamMember: string;
  fromDate: Date | null;
  toDate: Date | null;
  leaveReason: string;
};

type RecordLeaveModalProps = {
  opened: boolean;
  onClose: () => void;
};

export function RecordLeaveModal({
  opened,
  onClose,
}: RecordLeaveModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      isValid,
    },
  } = useForm<RecordLeaveFormValues>({
    mode: 'onChange',

    defaultValues: {
      teamMember: '',
      fromDate: null,
      toDate: null,
      leaveReason: '',
    },
  });

  const handleRecordLeave = (
    values: RecordLeaveFormValues,
  ) => {
    console.log('Recording leave:', values);

    // API mutation will go here later.

    reset();

    onClose();
  };

  const handleCancel = () => {
    reset();

    onClose();
  };

  return (
    <ReusableModal
      opened={opened}
      onClose={handleCancel}
      title="Record Leave / Unavailability"
      size={440}
      submitLabel="Record Leave"
      submitDisabled={!isValid}
      onSubmit={handleSubmit(handleRecordLeave)}
    >
      <Stack gap="md">

        <Text
          size="xs"
          c="dimmed"
        >
          Recorded leaves automatically suppress
          staleness and inactivity alerts during
          the absence period.
        </Text>

        <Controller
          name="teamMember"
          control={control}
          rules={{
            required: 'Team member is required',
          }}
          render={({
            field,
            fieldState,
          }) => (
            <Select
              label="Team Member"
              withAsterisk
              placeholder="Select team member"
              data={[
                {
                  value: 'alex',
                  label: 'Alex Chen (member)',
                },
                {
                  value: 'maya',
                  label: 'Maya Patel (member)',
                },
              ]}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
          }}
          spacing="md"
        >
          <Controller
            name="fromDate"
            control={control}
            rules={{
              required: 'From date is required',
            }}
            render={({
              field,
              fieldState,
            }) => (
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
            rules={{
              required: 'To date is required',
            }}
            render={({
              field,
              fieldState,
            }) => (
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
          rules={{
            required: 'Leave reason is required',
          }}
          render={({
            field,
            fieldState,
          }) => (
            <TextInput
              label="Leave Note / Reason"
              withAsterisk
              placeholder="e.g. Annual Leave"
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