import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCalendarEvent, IconPlus } from "@tabler/icons-react";
import { CreateTaskModal } from "./CreateTaskModal";
import { RecordLeaveModal } from "./RecordLeaveModal";

export default function MemberHeader() {

const [  createTaskOpened,{open: openCreateTask, close: closeCreateTask,},] = useDisclosure(false);
const [ leaveOpened, {open: openLeave, close: closeLeave,},] = useDisclosure(false);

    return(
        <Group
                justify="space-between"
                align="flex-start"
              >
                <Stack gap={2}>
                  <Title order={3}>
                    Alex Chen — Member Horizon (IC)
                  </Title>
        
                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    Personal execution queue, peer task visibility,
                    and accomplishment ledger
                  </Text>
                </Stack>
        
                <Group>
                  <Button
                    variant="outline"
                    color="gray"
                    leftSection={
                      <IconCalendarEvent size={16} />
                    }
                    onClick={openLeave}
                  >
                    Record Leave / Out of Office
                  </Button>
        
                  <Button
                    color="teal"
                    leftSection={
                      <IconPlus size={16} />
                    }
                    onClick={openCreateTask}
                  >
                    New Task
                  </Button>
                  <CreateTaskModal opened={createTaskOpened} onClose={closeCreateTask} />
                    <RecordLeaveModal opened={leaveOpened} onClose={closeLeave} />
                </Group>
              </Group>
    )
}