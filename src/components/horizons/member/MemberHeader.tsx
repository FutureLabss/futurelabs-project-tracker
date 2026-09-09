import { Button, Text, Title } from "@mantine/core";
import { IconCalendarOff, IconPlus } from "@tabler/icons-react";

export default function MemberHeader({
  name = "Alex Chen",
}: {
  name?: string;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <Title order={1} size={26}>
          {name} — Member Horizon (IC)
        </Title>
        <Text mt={4} size="sm" c="dimmed">
          Personal execution queue, peer task visibility, and accomplishment
          ledger
        </Text>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="default"
          h={44}
          leftSection={<IconCalendarOff size={17} stroke={1.8} />}
        >
          Record Leave / Out of Office
        </Button>
        <Button h={44} leftSection={<IconPlus size={19} stroke={2.2} />}>
          New Task
        </Button>
      </div>
    </div>
  );
}
