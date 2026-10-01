import { Modal, Stack, Text, Select, Textarea, Button, Group } from "@mantine/core";
import { useForm, Controller } from "react-hook-form";

export interface RaiseBlockerFormValues {
  category: string;
  resolverId: string;
  description: string;
}

interface RaiseBlockerModalProps {
  opened: boolean;
  onClose: () => void;
  taskTitle: string;
  people: Array<{ id: string; name: string }>;
  onSubmit: (values: RaiseBlockerFormValues) => Promise<void>;
  loading?: boolean;
}

export function RaiseBlockerModal({
  opened,
  onClose,
  taskTitle,
  people,
  onSubmit,
  loading = false,
}: RaiseBlockerModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RaiseBlockerFormValues>({
    defaultValues: {
      category: "third_party",
      resolverId: people[0]?.id ?? "",
      description: "",
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
          Raise Task Blocker
        </Text>
      }
      centered
      size="md"
    >
      <form onSubmit={handleFormSubmit}>
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Flagging blocker on: <Text component="span" fw={700} c="dark.9">{taskTitle}</Text>
          </Text>

          <Controller
            name="category"
            control={control}
            rules={{ required: "Blocker category is required" }}
            render={({ field }) => (
              <Select
                label="Blocker Category *"
                description="Categorize the systemic dependency"
                data={[
                  { value: "third_party", label: "Third-Party Vendor / External Service" },
                  { value: "infrastructure", label: "Infrastructure / Environment" },
                  { value: "cross_team", label: "Cross-Team Dependency" },
                  { value: "architecture", label: "Architecture / Security Gate" },
                ]}
                error={errors.category?.message}
                required
                {...field}
              />
            )}
          />

          <Controller
            name="resolverId"
            control={control}
            rules={{ required: "Resolver is required" }}
            render={({ field }) => (
              <Select
                label="Resolver / Accountable Owner *"
                description="Person responsible for clearing or facilitating this blocker"
                placeholder="Select resolver"
                data={people.map((p) => ({ value: p.id, label: p.name }))}
                error={errors.resolverId?.message}
                required
                {...field}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            rules={{ required: "Description is required" }}
            render={({ field }) => (
              <Textarea
                label="Blocker Description *"
                placeholder="Explain what is blocked and what is needed to resume progress..."
                minRows={3}
                error={errors.description?.message}
                required
                {...field}
              />
            )}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button color="red" type="submit" loading={loading}>
              Raise Blocker
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}