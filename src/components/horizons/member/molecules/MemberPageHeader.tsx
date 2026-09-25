import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendarEvent, IconPlus } from "@tabler/icons-react";
import { CreateTaskModal } from "../organisms/CreateTaskModal";
import { RecordLeaveModal } from "../organisms/RecordLeaveModal";
import { MemberView } from "../../../../types/dashboard";

interface MemberPageHeaderProps {
  personName?: string;
  personId: string;
  memberView: MemberView;
}

export function MemberPageHeader({
  personName,
  personId,
  memberView,
}: MemberPageHeaderProps) {
  const [createTaskOpened, { open: openCreateTask, close: closeCreateTask }] =
    useDisclosure(false);
  const [leaveOpened, { open: openLeave, close: closeLeave }] =
    useDisclosure(false);

  return (
    <Group justify="space-between" align="flex-start">
      <Stack gap={2}>
        <Title order={3}>{personName ?? "Member"} — Member Horizon (IC)</Title>

        <Text size="xs" c="dimmed">
          Personal execution queue, peer task visibility, and accomplishment
          ledger
        </Text>
      </Stack>

      <Group>
        {memberView !== "completed" && (
          <Button
            variant="outline"
            color="gray"
            leftSection={<IconCalendarEvent size={16} />}
            onClick={openLeave}
          >
            Record Leave / Out of Office
          </Button>
        )}

        {memberView === "team" && (
          <Button
            color="teal"
            leftSection={<IconPlus size={16} />}
            onClick={openCreateTask}
          >
            New Task
          </Button>
        )}
        <CreateTaskModal
          opened={createTaskOpened}
          onClose={closeCreateTask}
          personId={personId}
        />
        <RecordLeaveModal
          opened={leaveOpened}
          onClose={closeLeave}
          personId={personId}
        />
      </Group>
    </Group>
  );
}
