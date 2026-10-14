import { Text, Badge, Card, Group, Stack, Avatar, Box } from "@mantine/core";
import { IconClock, IconFolder, IconPlayerPlay } from "@tabler/icons-react";
import { ReusableModal } from "../../../modal/ReuseableModal";
import { useClearBlocker, useBlockers } from "../../../../api/hooks/use-blockers";
import { usePersons } from "../../../../api/hooks/use-availability";
import { useProjects } from "../../../../api/hooks/use-projects";

interface ClearBlockerModalProps {
  opened: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  projectId: string;
  taskOwnerId: string;
  actorId: string;
  activeBlockerId?: string;
}

export function ClearBlockerModal({
  opened,
  onClose,
  taskId,
  taskTitle,
  projectId,
  taskOwnerId,
  actorId,
  activeBlockerId,
}: ClearBlockerModalProps) {
  const { data: blockers = [] } = useBlockers(taskId);
  const { data: persons = [] } = usePersons();
  const { data: projects = [] } = useProjects();
  const { mutate: clearBlocker, isPending } = useClearBlocker();

  const blocker = blockers.find((b) => b.id === activeBlockerId);
  const blockerOwner = persons.find((p) => p.id === blocker?.ownerId);
  const taskOwner = persons.find((p) => p.id === taskOwnerId);
  const project = projects.find((p) => p.id === projectId);

  const handleClearBlocker = () => {
    if (!activeBlockerId) return;
    clearBlocker(
      { blockerId: activeBlockerId, actorId },
      { onSuccess: onClose }
    );
  };

  if (!blocker) return null;

  // Calculate days open (simple difference in days)
  const raisedDate = new Date(blocker.raisedAt);
  const daysOpen = Math.floor((new Date().getTime() - raisedDate.getTime()) / (1000 * 60 * 60 * 24));

  let categoryLabel: string = blocker.category;
  if (blocker.category === 'person') categoryLabel = 'PERSON / TEAM DEPENDENCY';
  if (blocker.category === 'external') categoryLabel = 'THIRD-PARTY VENDOR / EXTERNAL';
  if (blocker.category === 'decision') categoryLabel = 'LEADERSHIP DECISION';
  if (blocker.category === 'unclear_requirement') categoryLabel = 'UNCLEAR REQUIREMENTS';

  return (
    <ReusableModal
      opened={opened}
      onClose={onClose}
      title="Blocker Diagnostic & Dependency Resolution"
      submitLabel="Clear Blocker & Resume Work"
      onSubmit={handleClearBlocker}
      loading={isPending}
      size="lg"
    >
      <Stack gap="md">
        <Card withBorder radius="md" padding="md">
          <Group justify="space-between" mb="sm">
            <Badge color="red" radius="sm">{categoryLabel}</Badge>
            <Group gap="xs">
              <IconClock size={16} color="gray" />
              <Text size="sm" c="dimmed">Open for {daysOpen} working day(s)</Text>
              <Badge color="red" variant="filled" radius="sm">ACTIVE BLOCKER</Badge>
            </Group>
          </Group>

          <Text size="md" fw={500} mb="xl">
            {blocker.description}
          </Text>

          <Group justify="space-between" align="flex-end" pt="sm" style={{ borderTop: '1px solid #eee' }}>
            <Group gap="sm">
              <Avatar color="cyan" radius="xl" size="md">
                {blockerOwner?.name.charAt(0)}
              </Avatar>
              <Box>
                <Text size="xs" c="dimmed">Resolving Owner / Facilitator</Text>
                <Text size="sm" fw={600} c="teal">{blockerOwner?.name}</Text>
              </Box>
            </Group>
            <Text size="xs" c="dimmed">
              Raised on: {raisedDate.toLocaleDateString()}
            </Text>
          </Group>
        </Card>

        <Card withBorder radius="md" padding="md" bg="gray.0">
          <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">Impeded Work Item</Text>
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="md" fw={600} c="teal" mb={4}>{taskTitle}</Text>
              <Group gap={4}>
                <IconFolder size={14} color="gray" />
                <Text size="sm" c="dimmed">{project?.name}</Text>
              </Group>
            </Box>
            <Group gap="xs">
              <IconPlayerPlay size={14} color="gray" />
              <Text size="sm" c="dimmed">Owner: {taskOwner?.name}</Text>
            </Group>
          </Group>
        </Card>
      </Stack>
    </ReusableModal>
  );
}
