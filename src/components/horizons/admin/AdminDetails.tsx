import { useState } from "react";
import {
  Anchor,
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  Group,
  Pagination,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBriefcase,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarOff,
  IconChecklist,
  IconEdit,
  IconFolder,
  IconHistory,
  IconKeyOff,
  IconMail,
  IconShieldCheck,
  IconUser,
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react";
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
  pageSize = 25,
}: {
  tasks: Task[];
  data: AdminWorkspace;
  onTask: (id: string) => void;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(tasks.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <Stack gap="xs">
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
            {paginatedTasks.map((t) => (
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
      {tasks.length > pageSize && (
        <Group justify="space-between" mt="xs" px="xs">
          <Text size="xs" c="dimmed">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, tasks.length)} of {tasks.length} tasks
          </Text>
          <Pagination
            value={currentPage}
            onChange={setPage}
            total={totalPages}
            size="sm"
          />
        </Group>
      )}
    </Stack>
  );
}

export function LedgerList({
  records,
  data,
  onRecord,
  pageSize = 25,
}: {
  records: LedgerRecord[];
  data: AdminWorkspace;
  onRecord: (record: LedgerRecord) => void;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const getSubjectColor = (type: string) => {
    switch (type) {
      case "project":
        return "blue";
      case "task":
        return "teal";
      case "blocker":
        return "red";
      case "availability":
        return "orange";
      case "person":
        return "violet";
      default:
        return "gray";
    }
  };

  const getSubjectIcon = (type: string) => {
    switch (type) {
      case "project":
        return <IconFolder size={16} />;
      case "task":
        return <IconChecklist size={16} />;
      case "blocker":
        return <IconAlertTriangle size={16} />;
      case "availability":
        return <IconCalendar size={16} />;
      case "person":
        return <IconUser size={16} />;
      default:
        return <IconFolder size={16} />;
    }
  };

  return (
    <Stack gap="xs">
      {!records.length && <EmptyState message="No recorded changes." />}
      {paginatedRecords.map((r) => {
        const color = getSubjectColor(r.subjectType);
        const actor =
          data.people.find((p) => p.id === r.actorId)?.name ?? r.actorId;
        const timeFormatted = new Date(r.occurredAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Card
            key={r.id}
            withBorder
            p="sm"
            radius="md"
            style={{
              transition: "box-shadow 0.15s ease, border-color 0.15s ease",
              background: "var(--mantine-color-body)",
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap="sm" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
                <ThemeIcon
                  size="md"
                  radius="md"
                  variant="light"
                  color={color}
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  {getSubjectIcon(r.subjectType)}
                </ThemeIcon>

                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Group gap="xs" wrap="wrap">
                    <Anchor
                      component="button"
                      fw={600}
                      size="sm"
                      ta="left"
                      onClick={() => onRecord(r)}
                    >
                      {readable(r.type)}
                    </Anchor>
                    <Badge size="xs" variant="light" color={color}>
                      {r.subjectType}
                    </Badge>
                  </Group>

                  <Text size="xs" c="dimmed">
                    {actor} · {timeFormatted}
                  </Text>

                  {r.reason && (
                    <Text
                      size="xs"
                      mt={2}
                      c="dimmed"
                      lineClamp={2}
                      style={{
                        paddingLeft: 8,
                        borderLeft: "2px solid var(--mantine-color-default-border)",
                      }}
                    >
                      {r.reason}
                    </Text>
                  )}
                </Stack>
              </Group>

              <Button
                variant="subtle"
                color="gray"
                size="xs"
                rightSection={<IconArrowRight size={13} />}
                onClick={() => onRecord(r)}
                style={{ flexShrink: 0, marginLeft: 8 }}
              >
                Inspect
              </Button>
            </Group>
          </Card>
        );
      })}
      {records.length > pageSize && (
        <Group justify="space-between" mt="xs" px="xs">
          <Text size="xs" c="dimmed">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, records.length)} of {records.length}{" "}
            records
          </Text>
          <Pagination
            value={currentPage}
            onChange={setPage}
            total={totalPages}
            size="sm"
          />
        </Group>
      )}
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
  actorId,
}: {
  selection: { type: "project" | "task" | "person"; id: string };
  data: AdminWorkspace;
  onClose: () => void;
  onProject: (id: string) => void;
  onTask: (id: string) => void;
  onPerson: (id: string) => void;
  onAction: (action: AdminAction) => void;
  onRecord: (record: LedgerRecord) => void;
  /** The signed-in admin: they only start, submit or block tasks assigned to them. */
  actorId: string;
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
                  {task.assigneeId ? "Reassign owner" : "Assign owner"}
                </Button>
                {/* A reschedule counts as a slip, so unassigned work gets an owner first. */}
                {task.assigneeId && (
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() =>
                      onAction({ kind: "reschedule", taskId: task.id })
                    }
                  >
                    Reschedule
                  </Button>
                )}
                {task.status === "not_started" && task.assigneeId === actorId && (
                  <Button
                    size="xs"
                    onClick={() => onAction({ kind: "start", taskId: task.id })}
                  >
                    Start work
                  </Button>
                )}
                {["not_started", "in_progress"].includes(task.status) && task.assigneeId === actorId && (
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
          <Stack gap="md">
            {/* Person Hero Profile Card */}
            <Card
              withBorder
              p="md"
              radius="md"
              style={{ background: "var(--mantine-color-default-hover)" }}
            >
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                <Group gap="md" align="center" wrap="nowrap">
                  <Avatar
                    size="lg"
                    radius="xl"
                    color={
                      person.role === "admin"
                        ? "violet"
                        : person.role === "manager"
                          ? "blue"
                          : "teal"
                    }
                    variant="light"
                    style={{ fontWeight: 700, fontSize: 18, flexShrink: 0 }}
                  >
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </Avatar>
                  <Stack gap={2}>
                    <Text fw={700} size="lg">
                      {person.name}
                    </Text>
                    <Group gap="xs" wrap="wrap">
                      {person.email && (
                        <Group gap={4}>
                          <ThemeIcon size={14} variant="transparent" c="dimmed">
                            <IconMail size={13} />
                          </ThemeIcon>
                          <Text size="xs" c="dimmed">
                            {person.email}
                          </Text>
                        </Group>
                      )}
                      {person.title && (
                        <Group gap={4}>
                          <ThemeIcon size={14} variant="transparent" c="dimmed">
                            <IconBriefcase size={13} />
                          </ThemeIcon>
                          <Text size="xs" c="dimmed">
                            {person.title}
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </Stack>
                </Group>

                <Group gap="xs">
                  <Badge
                    size="sm"
                    variant="light"
                    color={
                      person.role === "admin"
                        ? "violet"
                        : person.role === "manager"
                          ? "blue"
                          : "teal"
                    }
                  >
                    {person.role.toUpperCase()}
                  </Badge>
                  <Badge
                    size="sm"
                    variant="dot"
                    color={person.status === "inactive" ? "gray" : "teal"}
                  >
                    {(person.status ?? "active").toUpperCase()}
                  </Badge>
                </Group>
              </Group>

              {/* Action Buttons Toolbar */}
              <Group gap="xs" mt="md" wrap="wrap">
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  leftSection={<IconEdit size={13} />}
                  onClick={() =>
                    onAction({ kind: "edit-person", personId: person.id })
                  }
                >
                  Edit profile
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconShieldCheck size={13} />}
                  onClick={() =>
                    onAction({ kind: "change-role", personId: person.id })
                  }
                >
                  Change role
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  leftSection={<IconCalendarOff size={13} />}
                  disabled={person.status === "inactive"}
                  onClick={() =>
                    onAction({ kind: "leave", personId: person.id })
                  }
                >
                  Record leave
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color={person.status === "inactive" ? "teal" : "orange"}
                  leftSection={
                    person.status === "inactive" ? (
                      <IconUserCheck size={13} />
                    ) : (
                      <IconUserOff size={13} />
                    )
                  }
                  onClick={() =>
                    onAction({
                      kind: "set-person-status",
                      personId: person.id,
                      targetStatus:
                        person.status === "inactive" ? "active" : "inactive",
                    })
                  }
                >
                  {person.status === "inactive"
                    ? "Activate account"
                    : "Deactivate account"}
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  leftSection={<IconKeyOff size={13} />}
                  onClick={() =>
                    onAction({ kind: "revoke-sessions", personId: person.id })
                  }
                >
                  Revoke sessions
                </Button>
              </Group>
            </Card>

            {/* Availability Section */}
            <Card withBorder p="md" radius="md">
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="sm" variant="light" color="orange">
                    <IconCalendarEvent size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    Availability
                  </Text>
                </Group>
                <Badge size="xs" variant="light" color="orange">
                  {data.availability.filter((a) => a.personId === person.id).length} recorded
                </Badge>
              </Group>

              <Stack gap="xs" mt="xs">
                {data.availability
                  .filter((a) => a.personId === person.id)
                  .map((a) => (
                    <Card
                      key={a.id}
                      withBorder
                      p="xs"
                      radius="sm"
                      style={{ background: "var(--mantine-color-default-hover)" }}
                    >
                      <Group gap="xs" align="center">
                        <ThemeIcon size="xs" variant="transparent" color="orange">
                          <IconCalendar size={12} />
                        </ThemeIcon>
                        <Text size="xs">
                          <Text span fw={600}>
                            {a.fromDate} → {a.toDate}
                          </Text>
                          {a.note ? `: ${a.note}` : ""}
                        </Text>
                      </Group>
                    </Card>
                  ))}
                {!data.availability.some((a) => a.personId === person.id) && (
                  <EmptyState message="No leave recorded." />
                )}
              </Stack>
            </Card>

            {/* Assigned Work Section */}
            <Card withBorder p="md" radius="md">
              <Group justify="space-between" mb="sm">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="sm" variant="light" color="blue">
                    <IconChecklist size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    Assigned work
                  </Text>
                </Group>
                <Badge size="xs" variant="light" color="blue">
                  {data.tasks.filter((t) => t.assigneeId === person.id).length} tasks
                </Badge>
              </Group>
              <TaskList
                tasks={data.tasks.filter((t) => t.assigneeId === person.id)}
                data={data}
                onTask={onTask}
              />
            </Card>
          </Stack>
        )}

        {/* Activity History Section */}
        <Card withBorder p="md" radius="md">
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" radius="sm" variant="light" color="teal">
                <IconHistory size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Activity history
              </Text>
            </Group>
            <Badge size="xs" variant="light" color="teal">
              {relatedLedger.length} events
            </Badge>
          </Group>
          <LedgerList records={relatedLedger} data={data} onRecord={onRecord} />
        </Card>
      </Stack>
    </Drawer>
  );
}
