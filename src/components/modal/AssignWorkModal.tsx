import { Stack, TextInput, Textarea, Select } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { ReusableModal } from "./ReuseableModal";

export interface AssignWorkFormValues {
  title: string;
  projectId: string;
  assigneeId: string;
  complexity: string;
  dueDate: string;
  justification: string;
}

interface AssignWorkModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: AssignWorkFormValues) => Promise<void>;
  loading?: boolean;
  projects: Array<{ id: string; name: string }>;
  people: Array<{ id: string; name: string }>;
}

export function AssignWorkModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  projects,
  people,
}: AssignWorkModalProps) {
  const fallbackProjects = [
    { id: "identity-access-engine", name: "Identity & Access Engine" },
    {
      id: "data-ingestion-analytics-pipeline",
      name: "Data Ingestion & Analytics pipeline",
    },
    { id: "mobile-sdk-onboarding", name: "Moblie SDK Onboarding" },
  ];

  const projectOptions = useMemo(
    () => (projects.length > 0 ? projects : fallbackProjects),
    [projects],
  );
  const personOptions = useMemo(
    () => (people.length > 0 ? people : [{ id: "manager", name: "Manager" }]),
    [people],
  );

  const defaultFormValues = useMemo<AssignWorkFormValues>(
    () => ({
      title: "",
      projectId: projectOptions[0]?.id ?? "",
      assigneeId: personOptions[0]?.id ?? "",
      complexity: "LOW (1 PT)",
      dueDate: new Date().toISOString().slice(0, 10),
      justification: "Planned task created",
    }),
    [projectOptions, personOptions],
  );

  const { control, handleSubmit, reset } = useForm<AssignWorkFormValues>({
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (opened) {
      reset(defaultFormValues);
    }
  }, [opened, defaultFormValues, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    const trimmed = {
      ...values,
      title: values.title.trim(),
      projectId: values.projectId?.trim() ?? "",
      assigneeId: values.assigneeId?.trim() ?? "",
      dueDate: values.dueDate?.trim() ?? "",
      justification: values.justification.trim(),
    };

    if (
      !trimmed.title ||
      !trimmed.projectId ||
      !trimmed.assigneeId ||
      !trimmed.dueDate ||
      !trimmed.justification
    ) {
      return;
    }

    await onSubmit(trimmed);
    reset(defaultFormValues);
    onClose();
  });

  return (
    <ReusableModal
      opened={opened}
      onClose={onClose}
      title="Assign Work"
      submitLabel="Assign Work"
      loading={loading}
      onSubmit={handleFormSubmit}
    >
      <Stack gap="sm">
        <Controller
          name="title"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextInput
              label="Deliverable Title"
              placeholder="e.g. Implement SMS 2FA Fallback"
              required
              {...field}
            />
          )}
        />

        <Controller
          name="projectId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              label="Project"
              placeholder="Select project"
              data={projectOptions.map((p) => ({ value: p.id, label: p.name }))}
              value={field.value ?? ""}
              onChange={(value) => field.onChange(value ?? "")}
              searchable
              clearable={false}
              nothingFoundMessage="No project found"
              required
            />
          )}
        />

        <Controller
          name="assigneeId"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              label="Assignee"
              placeholder="Select assignee"
              data={personOptions.map((p) => ({ value: p.id, label: p.name }))}
              value={field.value ?? ""}
              onChange={(value) => field.onChange(value ?? "")}
              searchable
              clearable={false}
              nothingFoundMessage="No assignee found"
              required
            />
          )}
        />

        <Controller
          name="complexity"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              label="Complexity"
              data={[
                "LOW (1 PT)",
                "MID (2 PT)",
                "HIGH (3 PT)",
                "CRITICAL (5 PT)",
              ]}
              value={field.value ?? "LOW (1 PT)"}
              onChange={(value) => field.onChange(value ?? "LOW (1 PT)")}
              required
            />
          )}
        />

        <Controller
          name="dueDate"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextInput
              type="date"
              label="Due date"
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.currentTarget.value)}
              required
            />
          )}
        />

        <Controller
          name="justification"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Textarea
              label="Mandatory Audit Ledger Note"
              placeholder="Mandatory reason for assignment / creation"
              required
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.currentTarget.value)}
            />
          )}
        />
      </Stack>
    </ReusableModal>
  );
}
