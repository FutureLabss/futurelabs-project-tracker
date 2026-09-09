import { Avatar, Badge, Group, Table, Text } from "@mantine/core";
import { IconAlertTriangle, IconEye } from "@tabler/icons-react";
import type { MemberTask } from "../../../types/member-task";

const complexityColors = { LOW: "teal", MID: "blue", HIGH: "grape" };
const statusColors: Partial<Record<MemberTask["status"], string>> = {
  "NOT STARTED": "gray",
  "IN PROGRESS": "blue",
  BLOCKED: "red",
};

export default function MemberTaskRow({ task }: { task: MemberTask }) {
  return (
    <Table.Tr>
      <Table.Td miw={360}>
        <Text fw={600}>{task.title}</Text>
        <Text mt={4} size="sm" c="dimmed">
          {task.description}
        </Text>
      </Table.Td>
      <Table.Td miw={180}>
        {task.assignee === "UNASSIGNED" ? (
          <Badge color="gray" variant="outline">
            Unassigned
          </Badge>
        ) : (
          <Group gap="sm" wrap="nowrap">
            <Avatar color="cyan" radius="xl" size={32}>
              {task.assigneeInitial}
            </Avatar>
            <div>
              <Text size="sm" fw={500} c="blue">
                {task.assignee}
              </Text>
              <Text size="xs" c="dimmed">
                {task.assigneeRole}
              </Text>
            </div>
          </Group>
        )}
      </Table.Td>
      <Table.Td miw={245}>
        <Text size="sm" fw={500} c="blue">
          {task.project}
        </Text>
      </Table.Td>
      <Table.Td miw={115}>
        <Badge color={complexityColors[task.complexity]} variant="outline">
          {task.complexity} ({task.points} PT{task.points > 1 ? "S" : ""})
        </Badge>
      </Table.Td>
      <Table.Td miw={175}>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={600} c={task.overdue ? "red" : undefined}>
            {task.dueDate}
          </Text>
          {task.overdue && (
            <Badge color="red" size="xs">
              Overdue
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td miw={140}>
        <Badge
          color={statusColors[task.status] ?? "gray"}
          variant="light"
          leftSection={
            task.status === "BLOCKED" ? (
              <IconAlertTriangle size={11} />
            ) : undefined
          }
        >
          {task.status}
        </Badge>
      </Table.Td>
      <Table.Td miw={165}>
        <Badge
          color="blue"
          variant="light"
          leftSection={<IconEye size={12} stroke={2} />}
        >
          {task.accessMode}
        </Badge>
      </Table.Td>
    </Table.Tr>
  );
}
