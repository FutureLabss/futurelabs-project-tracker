import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendarEvent } from "@tabler/icons-react";
import { RecordLeaveModal } from "../organisms/RecordLeaveModal";
import { MemberView } from "../../../../types/dashboard";

interface MemberPageHeaderProps {
  personName?: string;
  personId: string;
  memberView: MemberView;
}

const VIEW_DESCRIPTIONS: Record<MemberView, string> = {
  "my-work": "Your open tasks, earliest due date first",
  submitted: "Work you have submitted and what happened to it",
  history: "Your accepted work for any period you choose",
};

export function MemberPageHeader({
  personName,
  personId,
  memberView,
}: MemberPageHeaderProps) {
  const [leaveOpened, { open: openLeave, close: closeLeave }] =
    useDisclosure(false);

  return (
    <Group justify="space-between" align="flex-start">
      <Stack gap={2}>
        <Title order={3}>{personName ?? "Member"}</Title>
        <Text size="xs" c="dimmed">
          {VIEW_DESCRIPTIONS[memberView]}
        </Text>
      </Stack>

      <Button
        variant="outline"
        color="gray"
        leftSection={<IconCalendarEvent size={16} />}
        onClick={openLeave}
      >
        Record Leave / Out of Office
      </Button>
      <RecordLeaveModal
        opened={leaveOpened}
        onClose={closeLeave}
        personId={personId}
      />
    </Group>
  );
}
