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
import { useCreateTask } from '../../../../api/hooks/use-tasks';
import { useProjects } from '../../../../api/hooks/use-projects';
import { usePersons } from '../../../../api/hooks/use-availability';
import { TaskComplexity, TaskOrigin } from '../../../../entities/task.entity';
import { ReusableModal } from '../../../modal/ReuseableModal';


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
  personId: string;
};

export function CreateTaskModal({
  opened,
  onClose,
  personId,
}: CreateTaskModalProps) {
  const { data: projects = [] } = useProjects();
  const { data: persons = [] } = usePersons();
  const createTaskMutation = useCreateTask();

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
      project: '',
      title: '',
      description: '',
      assignee: '',
      complexity: 'MID',
      taskOrigin: 'PLANNED',
      dueDate: null,
    },
  });

  const handleCreateTask = (
    values: CreateTaskFormValues,
  ) => {
    if (!values.dueDate) return;

    createTaskMutation.mutate(
      {
        projectId: values.project,
        title: values.title,
        description: values.description,
        assigneeId: values.assignee || null,
        complexity: values.complexity as TaskComplexity,
        origin: values.taskOrigin as TaskOrigin,
        dueDate: values.dueDate.toISOString().split('T')[0],
        actorId: personId,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
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
              placeholder={projects.length === 0 ? "No projects available" : "Select a project"}
              nothingFoundMessage="No projects found"
              disabled={projects.length === 0}
              data={projects.map((p: any) => ({
                value: p.id,
                label: p.name,
              }))}
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
                placeholder={persons.length === 0 ? "No teammates available" : "Select an assignee (optional)"}
                nothingFoundMessage="No teammates found"
                disabled={persons.length === 0}
                data={persons.map((p: any) => ({
                  value: p.id,
                  label: `${p.name} (${p.role})`,
                }))}
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
                    value: 'LOW',
                    label: 'Low (1 pt)',
                  },
                  {
                    value: 'MID',
                    label: 'Mid (2 pts)',
                  },
                  {
                    value: 'HIGH',
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
                    value: 'PLANNED',
                    label:
                      'Planned (Sprint / Milestone)',
                  },
                  {
                    value: 'UNPLANNED',
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