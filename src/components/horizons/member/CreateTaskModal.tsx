import {
  Select,
  SimpleGrid,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';

import { DateInput } from '@mantine/dates';

import {
  Controller,
  useForm,
} from 'react-hook-form';
import { ReusableModal } from '../../modal/ReuseableModal';


type CreateTaskFormValues = {
  project: string;
  title: string;
  description: string;
  assignee: string;
  complexity: string;
  taskOrigin: string;
  dueDate: Date | null;
};

type CreateTaskModalProps = {
  opened: boolean;
  onClose: () => void;
};

export function CreateTaskModal({
  opened,
  onClose,
}: CreateTaskModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: {
      isValid,
    },
  } = useForm<CreateTaskFormValues>({
    mode: 'onChange',

    defaultValues: {
      project: 'mobile-sdk',
      title: '',
      description: '',
      assignee: 'alex',
      complexity: 'mid',
      taskOrigin: 'planned',
      dueDate: null,
    },
  });

  const handleCreateTask = (
    values: CreateTaskFormValues,
  ) => {
    console.log('Creating task:', values);

    // Later your API mutation will go here.

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
      title="Create New Task"
      size={440}
      submitLabel="Create Task"
      submitDisabled={!isValid}
      onSubmit={handleSubmit(handleCreateTask)}
    >
      <Stack gap="md">

        <Controller
          name="project"
          control={control}
          rules={{
            required: 'Project is required',
          }}
          render={({ field, fieldState }) => (
            <Select
              label="Project"
              withAsterisk
              data={[
                {
                  value: 'mobile-sdk',
                  label: 'Mobile SDK Onboarding',
                },
                {
                  value: 'identity',
                  label:
                    'Identity & Access Engine (IAM v2)',
                },
                {
                  value: 'data-ingestion',
                  label:
                    'Data Ingestion & Analytics Pipeline',
                },
              ]}
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="title"
          control={control}
          rules={{
            required: 'Task title is required',
          }}
          render={({ field, fieldState }) => (
            <TextInput
              label="Task Title"
              withAsterisk
              placeholder="e.g. Implement OIDC token exchange"
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              label="Description / Scope"
              placeholder="Describe deliverables and acceptance criteria..."
              minRows={3}
              {...field}
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
            name="assignee"
            control={control}
            render={({ field }) => (
              <Select
                label="Assignee"
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
                {...field}
              />
            )}
          />

          <Controller
            name="complexity"
            control={control}
            rules={{
              required: 'Complexity is required',
            }}
            render={({ field, fieldState }) => (
              <Select
                label="Complexity Weight"
                withAsterisk
                data={[
                  {
                    value: 'low',
                    label: 'Low (1 pt)',
                  },
                  {
                    value: 'mid',
                    label: 'Mid (2 pts)',
                  },
                  {
                    value: 'high',
                    label: 'High (3 pts)',
                  },
                ]}
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
          }}
          spacing="md"
        >
          <Controller
            name="taskOrigin"
            control={control}
            rules={{
              required: 'Task origin is required',
            }}
            render={({ field, fieldState }) => (
              <Select
                label="Task Origin"
                withAsterisk
                data={[
                  {
                    value: 'planned',
                    label:
                      'Planned (Sprint / Milestone)',
                  },
                  {
                    value: 'unplanned',
                    label: 'Unplanned',
                  },
                ]}
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="dueDate"
            control={control}
            rules={{
              required: 'Due date is required',
            }}
            render={({ field, fieldState }) => (
              <DateInput
                label="Due Date"
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

      </Stack>
    </ReusableModal>
  );
}