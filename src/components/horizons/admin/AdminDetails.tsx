import {
  Anchor,
  Badge,
  Button,
  Card,
  Drawer,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import type { AdminWorkspace } from "../../../api/hooks/use-admin-workspace";
import type { AdminAction } from "./AdminActionDialog";
import type { LedgerRecord } from "../../../entities/ledger-record.entity";
import type { Task } from "../../../entities/task.entity";
import { isOpen, readable } from "./admin-utils";
import { RagBadge } from "./atoms/RagBadge";
import { PersonLink } from "./atoms/PersonLink";
import { ProjectLink } from "./atoms/ProjectLink";
import { TaskStatusBadge } from "./atoms/TaskStatusBadge";
import { EmptyState } from "./atoms/EmptyState";

export function TaskList({
  tasks,
  data,
  onTask,
}: {
  tasks: Task[];
  data: AdminWorkspace;
  onTask: (id: string) => void;
}) {
  return (
    <Table.ScrollContainer minWidth={700}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {["Task", "Project", "Owner", "Due", "Status", "Complexity"].map(
              (h) => (
                <Table.Th key={h}>{h}</Table.Th>
              ),
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tasks.map((t) => (
            <Table.Tr key={t.id}>
              <Table.Td>
                <Anchor
                  component="button"
                  ta="left"
                  onClick={() => onTask(t.id)}
                >
                  {t.title}
                </Anchor>
              </Table.Td>
              <Table.Td>
                {data.projects.find((p) => p.id === t.projectId)?.name}
              </Table.Td>
              <Table.Td>
                {data.people.find((p) => p.id === t.assigneeId)?.name ??
                  "Unassigned"}
              </Table.Td>
              <Table.Td>{t.dueDate}</Table.Td>
              <Table.Td>
                <TaskStatusBadge status={t.status} />
              </Table.Td>
              <Table.Td>
                {t.complexity} · {t.origin}
              </Table.Td>
            </Table.Tr>
          ))}
          {!tasks.length && (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <EmptyState message="No tasks match this view." />
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
export function LedgerList({
  records,
  data,
  onRecord,
}: {
  records: LedgerRecord[];
  data: AdminWorkspace;
  onRecord: (record: LedgerRecord) => void;
}) {
  return (
    <Stack gap="xs">
      {!records.length && <EmptyState message="No recorded changes." />}
      {records.map((r) => (
        <Card key={r.id} withBorder padding="sm">
          <Group justify="space-between">
            <div>
              <Anchor component="button" onClick={() => onRecord(r)}>
                {readable(r.type)}
              </Anchor>
              <Text size="xs" c="dimmed">
                {data.people.find((p) => p.id === r.actorId)?.name ?? r.actorId}{" "}
                · {new Date(r.occurredAt).toLocaleString()}
              </Text>
              <Text size="sm">{r.reason}</Text>
            </div>
            <Badge variant="light">{r.subjectType}</Badge>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
export function AdminDetails({
  selection,
  data,
  onClose,
  onProject,
  onTask,
  onPerson,
  onAction,
  onRecord,
}: {
  selection: { type: "project" | "task" | "person"; id: string };
  data: AdminWorkspace;
  onClose: () => void;
  onProject: (id: string) => void;
  onTask: (id: string) => void;
  onPerson: (id: string) => void;
  onAction: (action: AdminAction) => void;
  onRecord: (record: LedgerRecord) => void;
}) {
  const project = data.projects.find((p) => p.id === selection.id);
  const task = data.tasks.find((t) => t.id === selection.id);
  const person = data.people.find((p) => p.id === selection.id);
  const title =
    selection.type === "project"
      ? project?.name
      : selection.type === "task"
        ? task?.title
        : person?.name;
  const personName = (id: string | null) =>
    data.people.find((p) => p.id === id)?.name ?? "Unassigned";
  const taskBlockers = data.blockers.filter((b) => b.taskId === task?.id);
  const summary = data.signals.projectSummaries.find(
    (p) => p.projectId === project?.id,
  );
  const projectTasks = data.tasks.filter((t) => t.projectId === project?.id);
  const relatedLedger = data.ledger.filter((r) =>
    selection.type === "project"
      ? r.subjectId === project?.id ||
        projectTasks.some((t) => t.id === r.subjectId) ||
        data.blockers.some(
          (b) =>
            b.id === r.subjectId && projectTasks.some((t) => t.id === b.taskId),
        )
      : selection.type === "task"
        ? r.subjectId === task?.id ||
          taskBlockers.some((b) => b.id === r.subjectId)
        : r.actorId === person?.id,
  );
  return (
    <Drawer
      opened
      position="right"
      size="xl"
      title={title ?? "Details"}
      onClose={onClose}
    >
      <Stack gap="lg">
        {!title && <Text>This record is no longer available.</Text>}
        {selection.type === "project" && project && (
          <>
            <Group>
              <RagBadge
                status={summary?.ragStatus}
                closed={project.state === "closed"}
              />
              <Text>
                {project.startDate} → {project.targetDate}
              </Text>
            </Group>
            <Text>{project.goal}</Text>
            <Text>
              Lead:{" "}
              {project.managerId ? (
                <PersonLink
                  name={personName(project.managerId)}
                  onClick={() => onPerson(project.managerId!)}
                />
              ) : (
                "Unmanaged"
              )}
            </Text>
            {summary?.ragReasons.map((reason) => (
              <Text key={reason} size="sm">
                • {reason}
              </Text>
            ))}
            {project.state === "active" && (
              <Group>
                <Button
                  onClick={() =>
                    onAction({ kind: "lead", projectId: project.id })
                  }
                >
                  Assign lead
                </Button>
                <Button
                  variant="light"
                  onClick={() =>
                    onAction({ kind: "task", projectId: project.id })
                  }
                >
                  Create task
                </Button>
                <Button
                  variant="light"
                  color="red"
                  disabled={projectTasks.some(isOpen)}
                  onClick={() =>
                    onAction({ kind: "close", projectId: project.id })
                  }
                >
                  Close project
                </Button>
              </Group>
            )}
            {project.state === "active" && projectTasks.some(isOpen) && (
              <Text size="xs" c="dimmed">
                Accept or cancel all open tasks to enable project closing.
              </Text>
            )}
            <Group justify="space-between">
              <Title order={3} size="h5">
                Project access
              </Title>
              {project.state === "active" && (
                <Button
                  size="xs"
                  variant="light"
                  onClick={() =>
                    onAction({ kind: "member", projectId: project.id })
                  }
                >
                  Grant access
                </Button>
              )}
            </Group>
            <Text size="sm" c="dimmed">
              Admins and the assigned lead have automatic access. Explicit
              members are listed below.
            </Text>
            {data.members
              .filter((m) => m.projectId === project.id)
              .map((m) => (
                <Group key={m.personId} justify="space-between">
                  <PersonLink
                    name={personName(m.personId)}
                    onClick={() => onPerson(m.personId)}
                  />
                  {project.state === "active" && (
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() =>
                        onAction({
                          kind: "remove-member",
                          projectId: project.id,
                          personId: m.personId,
                        })
                      }
                    >
                      Remove access
                    </Button>
                  )}
                </Group>
              ))}
            {!data.members.some((m) => m.projectId === project.id) && (
              <EmptyState message="No explicit members yet." />
            )}
            <Title order={3} size="h5">
              Project tasks ({projectTasks.length})
            </Title>
            <TaskList tasks={projectTasks} data={data} onTask={onTask} />
          </>
        )}
        {selection.type === "task" && task && (
          <>
            <Group>
              <TaskStatusBadge status={task.status} />
              <Badge variant="outline">
                {task.complexity} · {task.origin}
              </Badge>
            </Group>
            <Text>{task.description || "No description provided."}</Text>
            <ProjectLink
              name={data.projects.find((p) => p.id === task.projectId)?.name ?? "Unknown project"}
              onClick={() => onProject(task.projectId)}
            />
            <Text>
              Owner:{" "}
              {task.assigneeId ? (
                <PersonLink
                  name={personName(task.assigneeId)}
                  onClick={() => onPerson(task.assigneeId!)}
                />
              ) : (
                "Unassigned"
              )}
            </Text>
            <Text>Due: {task.dueDate}</Text>
            {task.submittedAt && (
              <Text size="sm">
                Submitted: {new Date(task.submittedAt).toLocaleString()}
              </Text>
            )}
            {task.acceptedAt && (
              <Text size="sm">
                Accepted: {new Date(task.acceptedAt).toLocaleString()} by{" "}
                {personName(task.acceptedBy)}
              </Text>
            )}
            {task.submissionNotes && <Text>{task.submissionNotes}</Text>}
            {task.deliverableUrl &&
              /^https?:\/\//i.test(task.deliverableUrl) && (
                <Anchor
                  href={task.deliverableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open deliverable
                </Anchor>
              )}
            {isOpen(task) && (
              <Group>
                <Button
                  size="xs"
                  onClick={() => onAction({ kind: "assign", taskId: task.id })}
                >
                  Assign owner
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() =>
                    onAction({ kind: "reschedule", taskId: task.id })
                  }
                >
                  Reschedule
                </Button>
                {task.status === "not_started" && (
                  <Button
                    size="xs"
                    onClick={() => onAction({ kind: "start", taskId: task.id })}
                  >
                    Start work
                  </Button>
                )}
                {["not_started", "in_progress"].includes(task.status) && (
                  <>
                    <Button
                      size="xs"
                      disabled={!task.assigneeId}
                      onClick={() =>
                        onAction({ kind: "submit", taskId: task.id })
                      }
                    >
                      Submit deliverable
                    </Button>
                    <Button
                      size="xs"
                      color="orange"
                      onClick={() =>
                        onAction({ kind: "blocker", taskId: task.id })
                      }
                    >
                      Raise blocker
                    </Button>
                  </>
                )}
                {task.status === "submitted" && (
                  <>
                    <Button
                      size="xs"
                      color="teal"
                      onClick={() =>
                        onAction({ kind: "accept", taskId: task.id })
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="xs"
                      color="orange"
                      onClick={() =>
                        onAction({ kind: "return", taskId: task.id })
                      }
                    >
                      Return for rework
                    </Button>
                  </>
                )}
                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  onClick={() => onAction({ kind: "cancel", taskId: task.id })}
                >
                  Cancel task
                </Button>
              </Group>
            )}
            <Title order={3} size="h5">
              Blocker history
            </Title>
            {!taskBlockers.length && (
              <EmptyState message="No blockers recorded." />
            )}
            {taskBlockers.map((b) => (
              <Card key={b.id} withBorder>
                <Stack gap="xs">
                  <Group>
                    <Badge color={b.clearedAt ? "teal" : "red"}>
                      {b.clearedAt ? "Resolved" : "Active"}
                    </Badge>
                    <Text size="sm">{readable(b.category)}</Text>
                  </Group>
                  <Text>{b.description}</Text>
                  <Text size="sm">Responsible: {personName(b.ownerId)}</Text>
                  <Text size="xs">
                    Raised {new Date(b.raisedAt).toLocaleString()}
                    {b.clearedAt
                      ? ` · Cleared ${new Date(b.clearedAt).toLocaleString()} by ${personName(b.clearedBy)}`
                      : ""}
                  </Text>
                  {b.blockingTaskId && (
                    <Anchor
                      component="button"
                      ta="left"
                      onClick={() => onTask(b.blockingTaskId!)}
                    >
                      Dependency:{" "}
                      {data.tasks.find((t) => t.id === b.blockingTaskId)
                        ?.title ?? "Task unavailable"}
                    </Anchor>
                  )}
                  {!b.clearedAt && isOpen(task) && (
                    <Button
                      size="xs"
                      onClick={() =>
                        onAction({
                          kind: "clear",
                          taskId: task.id,
                          blockerId: b.id,
                        })
                      }
                    >
                      Resolve blocker
                    </Button>
                  )}
                </Stack>
              </Card>
            ))}
          </>
        )}
        {selection.type === "person" && person && (
          <>
            <Text>{person.title}</Text>
            <Text>{person.email}</Text>
            <Group>
              <Badge>{person.role}</Badge>
              <Badge color={person.status === "inactive" ? "gray" : "teal"}>
                {person.status ?? "active"}
              </Badge>
            </Group>
            <Button
              disabled={person.status === "inactive"}
              onClick={() => onAction({ kind: "leave", personId: person.id })}
            >
              Record leave
            </Button>
            <Title order={3} size="h5">
              Availability
            </Title>
            {data.availability
              .filter((a) => a.personId === person.id)
              .map((a) => (
                <Text key={a.id}>
                  {a.fromDate} → {a.toDate}: {a.note}
                </Text>
              ))}
            {!data.availability.some((a) => a.personId === person.id) && (
              <EmptyState message="No leave recorded." />
            )}
            <Title order={3} size="h5">
              Assigned work
            </Title>
            <TaskList
              tasks={data.tasks.filter((t) => t.assigneeId === person.id)}
              data={data}
              onTask={onTask}
            />
          </>
        )}
        <Title order={3} size="h5">
          Activity history
        </Title>
        <LedgerList records={relatedLedger} data={data} onRecord={onRecord} />
      </Stack>
    </Drawer>
  );
}
