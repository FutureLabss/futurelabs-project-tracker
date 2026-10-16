import { Alert, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { Controller, useForm } from 'react-hook-form';
import { useCreateTask } from '../../../../api/hooks/use-tasks';
import { useProjects } from '../../../../api/hooks/use-projects';
import type { TaskComplexity } from '../../../../entities/task.entity';
import { ReusableModal } from '../../../modal/ReuseableModal';
import { isPastDueDate, PAST_DUE_DATE_MESSAGE } from '../../../../domain/calculations/due-dates';

type CreateTaskFormValues = {
  project: string;
  title: string;
  description: string;
  complexity: string;
  dueDate: Date | null;
};

type CreateTaskModalProps = {
  opened: boolean;
  onClose: () => void;
  personId: string;
};

/**
 * FR-05 / FR-06: a member creates a task for themselves, giving a project, a
 * title, a complexity and a due date. It is recorded as unplanned (SR-04).
 */
export function CreateTaskModal({ opened, onClose, personId }: CreateTaskModalProps) {
  const { data: projects = [] } = useProjects();
  const activeProjects = projects.filter((p) => p.state === 'active');
  const createTaskMutation = useCreateTask();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<CreateTaskFormValues>({
    mode: 'onChange',
    defaultValues: { project: '', title: '', description: '', complexity: 'mid', dueDate: null },
  });

  const close = () => {
    reset();
    createTaskMutation.reset();
    onClose();
  };

  const handleCreateTask = (values: CreateTaskFormValues) => {
    if (!values.dueDate) return;
    createTaskMutation.mutate(
      {
        projectId: values.project,
        title: values.title.trim(),
        description: values.description,
        assigneeId: personId,
        complexity: values.complexity as TaskComplexity,
        // The backend decides the origin; a self-assigned task is unplanned.
        origin: 'unplanned',
        // Local calendar date, not UTC (avoids saving the previous day).
        dueDate: dayjs(values.dueDate).format('YYYY-MM-DD'),
        actorId: personId,
      },
      { onSuccess: close },
    );
  };

  return (
    <ReusableModal
      opened={opened}
      onClose={close}
      title="Create New Task"
      size={440}
      submitLabel="Create Task"
      submitDisabled={!isValid}
      loading={createTaskMutation.isPending}
      onSubmit={handleSubmit(handleCreateTask)}
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          The task is assigned to you and recorded as unplanned work.
        </Text>

        <Controller
          name="project"
          control={control}
          rules={{ required: 'Project is required' }}
          render={({ field, fieldState }) => (
            <Select
              label="Project"
              withAsterisk
              placeholder={activeProjects.length === 0 ? 'No active projects available' : 'Select a project'}
              nothingFoundMessage="No projects found"
              disabled={activeProjects.length === 0}
              data={activeProjects.map((p) => ({ value: p.id, label: p.name }))}
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="title"
          control={control}
          rules={{ required: 'Task title is required', validate: (v) => !!v.trim() || 'Task title is required' }}
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

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Controller
            name="complexity"
            control={control}
            rules={{ required: 'Complexity is required' }}
            render={({ field, fieldState }) => (
              <Select
                label="Complexity Weight"
                withAsterisk
                data={[
                  { value: 'low', label: 'Low (1 pt)' },
                  { value: 'mid', label: 'Mid (2 pts)' },
                  { value: 'high', label: 'High (3 pts)' },
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
              validate: (value) =>
                !value || !isPastDueDate(dayjs(value).format('YYYY-MM-DD')) || PAST_DUE_DATE_MESSAGE,
            }}
            render={({ field, fieldState }) => (
              <DateInput
                label="Due Date"
                minDate={new Date()}
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

        {createTaskMutation.error && (
          <Alert color="red" variant="light">
            {createTaskMutation.error.message}
          </Alert>
        )}
      </Stack>
    </ReusableModal>
  );
}
