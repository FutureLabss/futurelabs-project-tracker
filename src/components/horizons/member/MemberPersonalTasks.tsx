import { Badge, Card, Stack, Table, Text, Title } from '@mantine/core';
import { personalTasks } from './personalMockData';

export default function MemberPersonalTasks({ completed }: { completed: boolean }) {
  const tasks = personalTasks.filter((task) =>
    completed ? task.status === 'accepted' : task.status !== 'accepted' && task.status !== 'cancelled',
  );

  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap={4} mb="lg">
        <Title order={2} size="h4">
          {completed ? 'Completed History' : 'My Active Work'} ({tasks.length})
        </Title>
        <Text size="sm" c="dimmed">
          {completed
            ? 'Your accepted deliverables and accomplishment ledger.'
            : 'Your personal execution queue, including work awaiting review.'}
        </Text>
      </Stack>
      <Table.ScrollContainer minWidth={760}>
        <Table verticalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Task Title &amp; Overview</Table.Th>
              <Table.Th>Project</Table.Th>
              <Table.Th>Complexity</Table.Th>
              <Table.Th>{completed ? 'Accepted On' : 'Due Date'}</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.map((task) => (
              <Table.Tr key={task.id}>
                <Table.Td>
                  <Text fw={600}>{task.title}</Text>
                  <Text size="sm" c="dimmed">{task.description}</Text>
                </Table.Td>
                <Table.Td>{task.project}</Table.Td>
                <Table.Td>
                  <Badge variant="outline" color={task.complexity === 'high' ? 'grape' : 'blue'}>
                    {task.complexity}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ whiteSpace: 'nowrap' }}>
                  {completed ? task.acceptedAt?.slice(0, 10) : task.dueDate}
                </Table.Td>
                <Table.Td>
                  <Badge color={completed ? 'teal' : task.status === 'submitted' ? 'violet' : 'blue'}>
                    {task.status.replaceAll('_', ' ')}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
            {tasks.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed">{completed ? 'No accepted tasks yet.' : 'No active tasks.'}</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}
