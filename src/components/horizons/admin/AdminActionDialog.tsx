import { useState, type FormEvent } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarOff,
  IconCalendarTime,
  IconChecklist,
  IconCircleCheck,
  IconCircleX,
  IconEdit,
  IconFolder,
  IconFolderOff,
  IconFolderPlus,
  IconKeyOff,
  IconMail,
  IconPlayerPlay,
  IconSend,
  IconShieldCheck,
  IconUser,
  IconUserCheck,
  IconUserMinus,
  IconUserPlus,
  IconUserShare,
} from "@tabler/icons-react";
import type { AdminWorkspace } from "../../../api/hooks/use-admin-workspace";
import { useAdminAction } from "../../../api/hooks/use-admin-workspace";
import {
  useAcceptTask,
  useAssignTask,
  useCreateTask,
  useRescheduleTask,
  useReturnTask,
  useSubmitTask,
  useUpdateTaskStatus,
} from "../../../api/hooks/use-tasks";
import {
  projectService,
  blockerService,
  peopleService,
} from "../../../services";
import type { TaskComplexity, TaskOrigin } from "../../../entities/task.entity";
import type { BlockerCategory } from "../../../entities/blocker.entity";
import type { UserRole } from "../../../entities/person.entity";
import { eligiblePeople } from "./admin-utils";

export type AdminAction = {
  kind:
    | "project"
    | "task"
    | "lead"
    | "member"
    | "remove-member"
    | "close"
    | "assign"
    | "reschedule"
    | "submit"
    | "accept"
    | "return"
    | "cancel"
    | "start"
    | "blocker"
    | "clear"
    | "leave"
    | "create-person"
    | "edit-person"
    | "change-role"
    | "set-person-status"
    | "revoke-sessions";
  projectId?: string;
  taskId?: string;
  personId?: string;
  blockerId?: string;
  targetRole?: UserRole;
  targetStatus?: "active" | "inactive";
};
const titles: Record<AdminAction["kind"], string> = {
  project: "Create project",
  task: "Create task",
  lead: "Assign project lead",
  member: "Grant project access",
  "remove-member": "Remove project access",
  close: "Close project",
  assign: "Assign task",
  reschedule: "Reschedule task",
  submit: "Submit deliverable",
  accept: "Accept deliverable",
  return: "Return for rework",
  cancel: "Cancel task",
  start: "Start task",
  blocker: "Raise blocker",
  clear: "Resolve blocker",
  leave: "Record leave",
  "create-person": "Add team member",
  "edit-person": "Edit team member profile",
  "change-role": "Change user role",
  "set-person-status": "Update account status",
  "revoke-sessions": "Revoke active sessions",
};

const descriptions: Record<AdminAction["kind"], string> = {
  project: "Define a new strategic initiative, target timeline, and leadership ownership.",
  task: "Create a new deliverable and define its ownership, scope, and timeline.",
  lead: "Designate an engineering manager or lead to oversee this project.",
  member: "Grant explicit access for team members to collaborate on this project.",
  "remove-member": "Revoke a team member's access from this project.",
  close: "Archive a completed initiative and finalize its delivery records.",
  assign: "Assign ownership of this task to a qualified team member.",
  reschedule: "Update the delivery deadline for this task with an audit rationale.",
  submit: "Submit completed deliverables for inspection and acceptance.",
  accept: "Approve and accept deliverables, recording them in organizational throughput.",
  return: "Return deliverable to assignee with rework feedback.",
  cancel: "Cancel this task and record the cancellation in the audit ledger.",
  start: "Transition this task into active in-progress development.",
  blocker: "Raise an operational blocker impeding progress on this deliverable.",
  clear: "Resolve an active blocker and unfreeze deliverable progress.",
  leave: "Log approved annual or personal leave for availability tracking.",
  "create-person": "Add a new team member to your organization directory.",
  "edit-person": "Update profile details, title, and contact information.",
  "change-role": "Update organizational permission tier and access role.",
  "set-person-status": "Activate or deactivate user account access.",
  "revoke-sessions": "Immediately terminate all active sessions for this account.",
};

const actionIcons: Record<AdminAction["kind"], typeof IconFolderPlus> = {
  project: IconFolderPlus,
  task: IconChecklist,
  lead: IconUserCheck,
  member: IconUserPlus,
  "remove-member": IconUserMinus,
  close: IconFolderOff,
  assign: IconUserShare,
  reschedule: IconCalendarTime,
  submit: IconSend,
  accept: IconCircleCheck,
  return: IconArrowBackUp,
  cancel: IconCircleX,
  start: IconPlayerPlay,
  blocker: IconAlertTriangle,
  clear: IconShieldCheck,
  leave: IconCalendarOff,
  "create-person": IconUserPlus,
  "edit-person": IconEdit,
  "change-role": IconShieldCheck,
  "set-person-status": IconUserCheck,
  "revoke-sessions": IconKeyOff,
};
export function AdminActionDialog({
  action,
  data,
  actorId,
  date,
  onClose,
}: {
  action: AdminAction;
  data: AdminWorkspace;
  actorId: string;
  date: string;
  onClose: () => void;
}) {
  const mutation = useAdminAction();
  const createTaskMutation = useCreateTask();
  const assignTaskMutation = useAssignTask();
  const rescheduleTaskMutation = useRescheduleTask();
  const submitTaskMutation = useSubmitTask();
  const acceptTaskMutation = useAcceptTask();
  const returnTaskMutation = useReturnTask();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const [validation, setValidation] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const task = data.tasks.find((t) => t.id === action.taskId);
  const targetPerson = data.people.find((p) => p.id === action.personId);
  const [projectId, setProjectId] = useState(
    action.projectId ?? task?.projectId ?? "",
  );
  const people = data.people.filter((p) => p.status !== "inactive");
  const options = (rows: typeof people) =>
    rows.map((p) => ({ value: p.id, label: `${p.name} (${p.role})` }));
  const eligible = eligiblePeople(data, projectId);
  const project = data.projects.find((p) => p.id === projectId);
  const safeUrl =
    task?.deliverableUrl && /^https?:\/\//i.test(task.deliverableUrl)
      ? task.deliverableUrl
      : undefined;

  const updateField = (name: string, value: string) => {
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const readField = (name: string) => String(formValues[name] ?? "").trim();
  // The default applies only until the field is edited, so clearing a field sticks.
  const fieldValue = (name: string, fallback: string) =>
    name in formValues ? formValues[name] : fallback;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation("");
    // Uncontrolled fields (people forms) only exist in the DOM form; controlled
    // fields also carry a name, so the form data covers both.
    const form = new FormData(event.currentTarget);
    const value = (name: string) =>
      String(form.get(name) ?? "").trim() || readField(name);
    const person = value("person") || null;
    if (["project", "task"].includes(action.kind) && !value("name")) {
      setValidation("A name is required.");
      return;
    }
    if (action.kind === "create-person") {
      if (!value("name")) {
        setValidation("Person name is required.");
        return;
      }
      if (!value("email") || !value("email").includes("@")) {
        setValidation("A valid email address is required.");
        return;
      }
    }
    if (action.kind === "edit-person" && !value("name")) {
      setValidation("Name cannot be blank.");
      return;
    }
    if (
      ["reschedule", "return", "blocker"].includes(action.kind) &&
      !value("reason")
    ) {
      setValidation("Please provide a reason or description.");
      return;
    }
    if (action.kind === "project" && value("end") < value("start")) {
      setValidation("Target date must be on or after the start date.");
      return;
    }
    if (action.kind === "leave" && value("end") < value("start")) {
      setValidation("Leave end date must be on or after the start date.");
      return;
    }
    if (action.kind === "task" && !projectId) {
      setValidation("Select a project.");
      return;
    }
    if (["member", "blocker", "leave"].includes(action.kind) && !person) {
      setValidation("Select a person.");
      return;
    }
    const operation = async () => {
      switch (action.kind) {
        case "project":
          return projectService.createProject({
            name: value("name"),
            goal: value("description"),
            startDate: value("start"),
            targetDate: value("end"),
            managerId: person,
            actorId,
          });
        case "lead":
          return projectService.assignProjectManager(
            projectId,
            person,
            actorId,
          );
        case "member":
          return projectService.setProjectMember(
            projectId,
            person!,
            true,
            actorId,
          );
        case "remove-member":
          return projectService.setProjectMember(
            projectId,
            action.personId!,
            false,
            actorId,
          );
        case "close":
          return projectService.closeProject(projectId, actorId);
        case "task":
          return createTaskMutation.mutateAsync({
            projectId,
            title: value("name"),
            description: value("description"),
            assigneeId: person,
            complexity: value("complexity") as TaskComplexity,
            origin: value("origin") as TaskOrigin,
            dueDate: value("due"),
            actorId,
          });
        case "assign":
          return assignTaskMutation.mutateAsync({
            taskId: task!.id,
            assigneeId: person,
            actorId,
          });
        case "reschedule":
          return rescheduleTaskMutation.mutateAsync({
            taskId: task!.id,
            newDueDate: value("due"),
            reason: value("reason"),
            actorId,
          });
        case "submit":
          return submitTaskMutation.mutateAsync({
            taskId: task!.id,
            actorId,
            notes: value("description"),
            deliverableUrl: value("url") || undefined,
          });
        case "accept":
          return acceptTaskMutation.mutateAsync({
            taskId: task!.id,
            managerId: actorId,
          });
        case "return":
          return returnTaskMutation.mutateAsync({
            taskId: task!.id,
            managerId: actorId,
            reason: value("reason"),
          });
        case "start":
          return updateTaskStatusMutation.mutateAsync({
            taskId: task!.id,
            status: "in_progress",
            actorId,
          });
        case "cancel":
          return updateTaskStatusMutation.mutateAsync({
            taskId: task!.id,
            status: "cancelled",
            actorId,
          });
        case "blocker":
          return blockerService.raiseBlocker({
            taskId: task!.id,
            category: value("category") as BlockerCategory,
            description: value("reason"),
            ownerId: person!,
            blockingTaskId: value("dependency") || undefined,
            actorId,
          });
        case "clear":
          return blockerService.clearBlocker(action.blockerId!, actorId);
        case "leave":
          return peopleService.recordAvailability({
            personId: person!,
            fromDate: value("start"),
            toDate: value("end"),
            note: `Leave: ${value("description")}`,
            actorId,
          });
        case "create-person":
          return peopleService.createPerson({
            name: value("name"),
            email: value("email"),
            role: (value("role") || "member") as UserRole,
            title: value("title") || undefined,
            status: (value("status") || "active") as "active" | "inactive",
            actorId,
          });
        case "edit-person":
          return peopleService.updateProfile({
            personId: action.personId!,
            name: value("name") || undefined,
            title: value("title") || undefined,
            avatarUrl: value("avatarUrl") || undefined,
            actorId,
          });
        case "change-role":
          return peopleService.changeUserRole({
            personId: action.personId!,
            role: value("role") as UserRole,
            actorId,
          });
        case "set-person-status":
          return peopleService.setPersonStatus({
            personId: action.personId!,
            status: (action.targetStatus || value("status")) as
              | "active"
              | "inactive",
            actorId,
          });
        case "revoke-sessions":
          return peopleService.revokePersonSessions({
            personId: action.personId!,
            actorId,
          });
      }
    };
    try {
      await mutation.mutateAsync(operation);
      onClose();
    } catch {
      /* Mutation error remains visible; preserve form values. */
    }
  }
  const isDestructive =
    ["cancel", "remove-member", "close", "revoke-sessions"].includes(
      action.kind,
    ) ||
    (action.kind === "set-person-status" &&
      (action.targetStatus ??
        (targetPerson?.status === "inactive" ? "active" : "inactive")) ===
        "inactive");

  const isWarning = ["blocker", "return", "reschedule"].includes(action.kind);
  const actionColor = isDestructive ? "red" : isWarning ? "orange" : "teal";
  const ActionIcon = actionIcons[action.kind] || IconFolderPlus;

  const personField = (
    rows: typeof people,
    label: string,
    defaultValue?: string | null,
    required = false,
    placeholder = "Select a person",
  ) => (
    <Select
      name="person"
      label={label}
      data={options(rows)}
      value={fieldValue("person", defaultValue ?? "") || null}
      onChange={(value) => updateField("person", value ?? "")}
      placeholder={placeholder}
      nothingFoundMessage="No eligible users found"
      searchable
      clearable={!required}
      required={required}
      leftSection={<IconUserCheck size={16} />}
    />
  );
  return (
    <Modal
      opened
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
      closeOnClickOutside={!mutation.isPending}
      closeOnEscape={!mutation.isPending}
      withCloseButton={!mutation.isPending}
      title={titles[action.kind]}
      centered
      size="lg"
      radius="md"
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          {/* Action Header Banner */}
          <Card
            withBorder
            p="xs"
            radius="sm"
            style={{ background: "var(--mantine-color-default-hover)" }}
          >
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon
                size="md"
                radius="sm"
                variant="light"
                color={actionColor}
                style={{ flexShrink: 0 }}
              >
                <ActionIcon size={18} />
              </ThemeIcon>
              <Text size="xs" c="dimmed">
                {descriptions[action.kind]}
              </Text>
            </Group>
          </Card>

          {(validation || mutation.error) && (
            <Alert
              color="red"
              role="alert"
              icon={<IconAlertTriangle size={16} />}
              radius="sm"
            >
              {validation || mutation.error?.message}
            </Alert>
          )}

          {task && (
            <Card withBorder p="xs" radius="sm">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">
                    Target task
                  </Text>
                  <Text fw={600} size="sm">
                    {task.title}
                  </Text>
                </div>
                <Badge size="xs" variant="light">
                  {task.status}
                </Badge>
              </Group>
            </Card>
          )}

          {project && action.kind !== "task" && (
            <Card withBorder p="xs" radius="sm">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">
                    Project
                  </Text>
                  <Text fw={600} size="sm">
                    {project.name}
                  </Text>
                </div>
                <Badge
                  size="xs"
                  variant="light"
                  color={project.state === "active" ? "teal" : "gray"}
                >
                  {project.state}
                </Badge>
              </Group>
            </Card>
          )}

          {action.kind === "project" && (
            <>
              <TextInput
                name="name"
                label="Project name"
                placeholder="e.g. Identity & Access Engine"
                leftSection={<IconFolder size={16} />}
                required
                maxLength={200}
                value={fieldValue("name", "")}
                onChange={(event) =>
                  updateField("name", event.currentTarget.value)
                }
              />
              <Textarea
                name="description"
                label="Goal and expected outcome"
                placeholder="Define the primary objective, deliverables, and success criteria..."
                minRows={3}
                autosize
                required
                value={fieldValue("description", "")}
                onChange={(event) =>
                  updateField("description", event.currentTarget.value)
                }
              />
              <Group grow gap="md">
                <TextInput
                  name="start"
                  type="date"
                  label="Start date"
                  value={fieldValue("start", date)}
                  onChange={(event) =>
                    updateField("start", event.currentTarget.value)
                  }
                  leftSection={<IconCalendar size={16} />}
                  required
                />
                <TextInput
                  name="end"
                  type="date"
                  label="Target date"
                  value={fieldValue("end", date)}
                  onChange={(event) =>
                    updateField("end", event.currentTarget.value)
                  }
                  leftSection={<IconCalendarEvent size={16} />}
                  required
                />
              </Group>
              {personField(
                people.filter((p) => p.role !== "member"),
                "Project lead (optional)",
              )}
            </>
          )}
          {action.kind === "task" && (
            <>
              <Select
                name="project"
                label="Project"
                data={data.projects
                  .filter((p) => p.state === "active")
                  .map((p) => ({ value: p.id, label: p.name }))}
                value={projectId || null}
                onChange={(v) => {
                  setProjectId(v ?? "");
                  updateField("project", v ?? "");
                }}
                searchable
                required
                leftSection={<IconFolder size={16} />}
              />
              <TextInput
                name="name"
                label="Task title"
                required
                maxLength={200}
                value={fieldValue("name", "")}
                onChange={(event) =>
                  updateField("name", event.currentTarget.value)
                }
                leftSection={<IconChecklist size={16} />}
              />
              <Textarea
                name="description"
                label="Description and acceptance criteria"
                value={fieldValue("description", "")}
                onChange={(event) =>
                  updateField("description", event.currentTarget.value)
                }
                minRows={3}
                autosize
              />
              <div key={projectId}>
                {personField(
                  eligible,
                  "Assignee (optional)",
                  undefined,
                  false,
                  "Select an assignee",
                )}
              </div>
              <Text size="xs" c="dimmed">
                Grant project access from the project detail before assigning
                other team members.
              </Text>
              <Group grow>
                <Select
                  name="complexity"
                  label="Complexity"
                  data={["low", "mid", "high"]}
                  value={fieldValue("complexity", "mid")}
                  onChange={(value) =>
                    updateField("complexity", value ?? "mid")
                  }
                  allowDeselect={false}
                  required
                />
                <Select
                  name="origin"
                  label="Origin"
                  data={["planned", "unplanned"]}
                  value={fieldValue("origin", "planned")}
                  onChange={(value) =>
                    updateField("origin", value ?? "planned")
                  }
                  allowDeselect={false}
                  required
                />
              </Group>
              <TextInput
                name="due"
                label="Due date"
                type="date"
                value={fieldValue("due", date)}
                onChange={(event) =>
                  updateField("due", event.currentTarget.value)
                }
                leftSection={<IconCalendar size={16} />}
                required
              />
            </>
          )}
          {action.kind === "lead" && (
            <>
              {personField(
                people.filter((p) => p.role !== "member"),
                "Project lead",
                project?.managerId,
              )}
              <Text size="sm">
                Clearing the selection leaves the project unmanaged. An outgoing
                lead needs explicit project membership to retain access.
              </Text>
            </>
          )}
          {action.kind === "member" && (
            <>
              {personField(
                people.filter(
                  (p) =>
                    !data.members.some(
                      (m) => m.projectId === projectId && m.personId === p.id,
                    ),
                ),
                "Team member",
                undefined,
                true,
              )}
              <Text size="sm">
                The member can read this project and be assigned its work.
                Project leads and admins already have access.
              </Text>
            </>
          )}
          {action.kind === "assign" &&
            personField(eligible, "Task owner", task?.assigneeId)}
          {action.kind === "reschedule" && (
            <>
              <TextInput
                name="due"
                type="date"
                label="New due date"
                value={fieldValue("due", task?.dueDate ?? "")}
                onChange={(event) =>
                  updateField("due", event.currentTarget.value)
                }
                leftSection={<IconCalendarTime size={16} />}
                required
              />
              <Textarea
                name="reason"
                label="Reason for rescheduling"
                value={fieldValue("reason", "")}
                onChange={(event) =>
                  updateField("reason", event.currentTarget.value)
                }
                minRows={2}
                autosize
                required
              />
            </>
          )}
          {action.kind === "submit" && (
            <>
              <TextInput
                name="url"
                type="url"
                label="Deliverable URL"
                pattern="https?://.*"
                value={fieldValue("url", task?.deliverableUrl ?? "")}
                onChange={(event) =>
                  updateField("url", event.currentTarget.value)
                }
              />
              <Textarea
                name="description"
                label="Submission notes"
                value={fieldValue("description", task?.submissionNotes ?? "")}
                onChange={(event) =>
                  updateField("description", event.currentTarget.value)
                }
              />
              <Text size="sm">This sends the task to the review queue.</Text>
            </>
          )}
          {["accept", "return"].includes(action.kind) && (
            <>
              <Text>
                {task?.submissionNotes || "No submission notes provided."}
              </Text>
              {safeUrl && (
                <Text
                  component="a"
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  c="blue"
                >
                  Open deliverable
                </Text>
              )}
            </>
          )}
          {action.kind === "return" && (
            <Textarea
              name="reason"
              label="Required changes"
              value={fieldValue("reason", "")}
              onChange={(event) =>
                updateField("reason", event.currentTarget.value)
              }
              required
            />
          )}
          {action.kind === "accept" && (
            <Text>
              Confirm that this deliverable meets its acceptance criteria.
              Accepted work becomes read-only.
            </Text>
          )}
          {action.kind === "blocker" && (
            <>
              <Select
                name="category"
                label="Category"
                data={[
                  { value: "person", label: "Person" },
                  { value: "external", label: "External" },
                  { value: "decision", label: "Decision" },
                  {
                    value: "unclear_requirement",
                    label: "Unclear requirement",
                  },
                ]}
                value={fieldValue("category", "external")}
                onChange={(value) =>
                  updateField("category", value ?? "external")
                }
                allowDeselect={false}
                required
              />
              <Textarea
                name="reason"
                label="What is blocking delivery?"
                value={fieldValue("reason", "")}
                onChange={(event) =>
                  updateField("reason", event.currentTarget.value)
                }
                required
              />
              {personField(eligible, "Responsible person", undefined, true)}
              <Select
                name="dependency"
                label="Blocking task (optional)"
                data={data.tasks
                  .filter((t) => t.id !== task?.id && isTaskOpen(t.status))
                  .map((t) => ({ value: t.id, label: t.title }))}
                value={fieldValue("dependency", "") || null}
                onChange={(value) => updateField("dependency", value ?? "")}
                searchable
                clearable
              />
            </>
          )}
          {action.kind === "leave" && (
            <>
              {personField(people, "Person", action.personId, true)}
              <Group grow>
                <TextInput
                  name="start"
                  type="date"
                  label="First day"
                  value={fieldValue("start", date)}
                  onChange={(event) =>
                    updateField("start", event.currentTarget.value)
                  }
                  leftSection={<IconCalendar size={16} />}
                  required
                />
                <TextInput
                  name="end"
                  type="date"
                  label="Last day"
                  value={fieldValue("end", date)}
                  onChange={(event) =>
                    updateField("end", event.currentTarget.value)
                  }
                  leftSection={<IconCalendarEvent size={16} />}
                  required
                />
              </Group>
              <Textarea
                name="description"
                label="Note"
                minRows={2}
                autosize
                value={fieldValue("description", "")}
                onChange={(event) =>
                  updateField("description", event.currentTarget.value)
                }
              />
            </>
          )}
          {action.kind === "cancel" && (
            <Text>
              Cancel this task? Its active blocker will be resolved and it will
              leave the review queue. Cancelled work becomes read-only.
            </Text>
          )}
          {action.kind === "clear" && (
            <Text>
              {
                data.blockers.find((b) => b.id === action.blockerId)
                  ?.description
              }
              <br />
              Confirm resolution to return this task to in progress.
            </Text>
          )}
          {action.kind === "start" && (
            <Text>Move this task to in progress?</Text>
          )}
          {action.kind === "close" && (
            <Text>
              Close this project? All tasks must already be accepted or
              cancelled. Closed projects remain available in history and cannot
              receive new tasks.
            </Text>
          )}
          {action.kind === "remove-member" && (
            <Text>
              Remove explicit project access for{" "}
              {data.people.find((p) => p.id === action.personId)?.name}?
              Reassign their open tasks and resolve their blockers first.
              Lead/admin access is independent of membership.
            </Text>
          )}
          {action.kind === "create-person" && (
            <>
              <TextInput
                name="name"
                label="Full name"
                placeholder="Jane Doe"
                leftSection={<IconUser size={16} />}
                required
              />
              <TextInput
                name="email"
                label="Email address"
                type="email"
                placeholder="jane@futurelabs.io"
                leftSection={<IconMail size={16} />}
                required
              />
              <Select
                name="role"
                label="Role"
                data={[
                  { value: "member", label: "Team Member (contributor)" },
                  { value: "manager", label: "Project Manager" },
                  { value: "admin", label: "Administrator (org-wide access)" },
                ]}
                defaultValue="member"
                allowDeselect={false}
                required
              />
              <TextInput
                name="title"
                label="Job title"
                placeholder="e.g. Infrastructure Engineer"
              />
              <Select
                name="status"
                label="Initial account status"
                data={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                defaultValue="active"
                allowDeselect={false}
              />
            </>
          )}
          {action.kind === "edit-person" && (
            <>
              <TextInput
                name="name"
                label="Full name"
                defaultValue={targetPerson?.name}
                leftSection={<IconUser size={16} />}
                required
              />
              <TextInput
                name="title"
                label="Job title"
                defaultValue={targetPerson?.title ?? ""}
              />
              <TextInput
                name="avatarUrl"
                label="Avatar URL (optional)"
                defaultValue={targetPerson?.avatarUrl ?? ""}
              />
            </>
          )}
          {action.kind === "change-role" && (
            <>
              <Select
                name="role"
                label="New role"
                data={[
                  { value: "member", label: "Team Member" },
                  { value: "manager", label: "Project Manager" },
                  { value: "admin", label: "Administrator" },
                ]}
                defaultValue={targetPerson?.role}
                allowDeselect={false}
                required
              />
              <Text size="sm" c="dimmed">
                Safeguards: The last active administrator cannot be demoted.
                Demoting a manager unassigns project leadership responsibilities
                while preserving project membership for open tasks.
              </Text>
            </>
          )}
          {action.kind === "set-person-status" && (
            <>
              <input
                type="hidden"
                name="status"
                value={
                  action.targetStatus ??
                  (targetPerson?.status === "inactive" ? "active" : "inactive")
                }
              />
              <Text>
                Are you sure you want to{" "}
                {(action.targetStatus ??
                  (targetPerson?.status === "inactive"
                    ? "active"
                    : "inactive")) === "inactive"
                  ? "deactivate"
                  : "activate"}{" "}
                <strong>{targetPerson?.name}</strong>?
              </Text>
              {(action.targetStatus ??
                (targetPerson?.status === "inactive"
                  ? "active"
                  : "inactive")) === "inactive" && (
                <Text size="sm" c="dimmed">
                  Deactivating an account immediately revokes all active Tracker
                  sessions, unassigns project leadership, and prevents further
                  mutations. The last active admin cannot be deactivated.
                </Text>
              )}
            </>
          )}
          {action.kind === "revoke-sessions" && (
            <Text>
              Revoke all active Tracker sessions for{" "}
              <strong>{targetPerson?.name}</strong>? The user will be required
              to sign in again.
            </Text>
          )}
          <Divider mt="xs" mb="xs" />
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Back
            </Button>
            <Button
              type="submit"
              loading={mutation.isPending}
              color={
                [
                  "cancel",
                  "remove-member",
                  "close",
                  "revoke-sessions",
                ].includes(action.kind) ||
                (action.kind === "set-person-status" &&
                  (action.targetStatus ??
                    (targetPerson?.status === "inactive"
                      ? "active"
                      : "inactive")) === "inactive")
                  ? "red"
                  : "teal"
              }
            >
              {titles[action.kind]}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
function isTaskOpen(status: string) {
  return !["accepted", "cancelled"].includes(status);
}
