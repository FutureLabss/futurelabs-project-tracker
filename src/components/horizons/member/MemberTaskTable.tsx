import { Table, Text } from "@mantine/core";
import type { MemberTask } from "../../../types/member-task";
import MemberTaskRow from "./MemberTaskRow";

export default function MemberTaskTable({ tasks }: { tasks: MemberTask[] }) {
  return (
    <Table.ScrollContainer minWidth={1350}>
      <Table verticalSpacing="md" horizontalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {[
              "Task Title & Overview",
              "Assigned Teammate",
              "Project",
              "Complexity",
              "Due Date",
              "Status",
              "Access Mode",
            ].map((label) => (
              <Table.Th key={label}>{label}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tasks.map((task) => (
            <MemberTaskRow key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text ta="center" c="dimmed" p="lg">
                  No shared tasks.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
