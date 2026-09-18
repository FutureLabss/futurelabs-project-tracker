import { Select, Textarea, Text } from "@mantine/core";
import { useState, useEffect } from "react";
import { ReusableModal } from "../../../modal/ReuseableModal";
import { useRaiseBlocker } from "../../../../api/hooks/use-blockers";
import { usePersons } from "../../../../api/hooks/use-availability";
import { BlockerCategory } from "../../../../entities/blocker.entity";

interface RaiseBlockerModalProps {
  opened: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  actorId: string;
}

export function RaiseBlockerModal({
  opened,
  onClose,
  taskId,
  taskTitle,
  actorId,
}: RaiseBlockerModalProps) {
  const [category, setCategory] = useState<BlockerCategory | null>("person");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const { data: persons = [] } = usePersons();
  
  useEffect(() => {
    if (persons.length > 0 && !ownerId) {
      setOwnerId(persons[0].id);
    }
  }, [persons, ownerId]);
  const { mutate: raiseBlocker, isPending } = useRaiseBlocker();

  const handleRaiseBlocker = () => {
    if (!category || !ownerId || !description.trim()) return;

    raiseBlocker(
      {
        taskId,
        category,
        ownerId,
        description,
        actorId,
      },
      {
        onSuccess: () => {
          setCategory(null);
          setOwnerId(null);
          setDescription("");
          onClose();
        },
      }
    );
  };

  const isSubmitDisabled = !category || !ownerId || !description.trim();

  return (
    <ReusableModal
      opened={opened}
      onClose={onClose}
      title="Raise Task Blocker"
      submitLabel="Raise Blocker"
      onSubmit={handleRaiseBlocker}
      loading={isPending}
      submitDisabled={isSubmitDisabled}
    >
      <Text size="sm" mb="md">
        Flagging blocker on: <strong>{taskTitle}</strong>
      </Text>

      <Select
        label="Blocker Category"
        description="Categorize the systemic dependency"
        placeholder="Select a category"
        withAsterisk
        data={[
          { value: "person", label: "Person / Team Dependency" },
          { value: "external", label: "Third-Party Vendor / External Service" },
          { value: "decision", label: "Blocked on Leadership Decision" },
          { value: "unclear_requirement", label: "Unclear Requirements" },
        ]}
        value={category}
        onChange={(val) => setCategory(val as BlockerCategory)}
        mb="md"
      />

      <Select
        label="Resolver / Accountable Owner"
        description="Person responsible for clearing or facilitating this blocker"
        placeholder="Select owner"
        withAsterisk
        data={persons.map((p) => ({
          value: p.id,
          label: `${p.name} (${p.role})`,
        }))}
        value={ownerId}
        onChange={setOwnerId}
        mb="md"
        searchable
      />

      <Textarea
        label="Blocker Description"
        placeholder="Explain what is blocked and what is needed to resume progress..."
        withAsterisk
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        minRows={4}
      />
    </ReusableModal>
  );
}
