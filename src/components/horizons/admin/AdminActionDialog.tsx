import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import type { AdminWorkspace } from "../../../api/hooks/use-admin-workspace";
import { useAdminAction } from "../../../api/hooks/use-admin-workspace";
import {
  projectService,
  taskService,
  blockerService,
  peopleService,
} from "../../../services";
import type { TaskComplexity, TaskOrigin } from "../../../entities/task.entity";
import type { BlockerCategory } from "../../../entities/blocker.entity";
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
    | "leave";
  projectId?: string;
  taskId?: string;
  personId?: string;
  blockerId?: string;
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
  const [validation, setValidation] = useState("");
  const task = data.tasks.find((t) => t.id === action.taskId);
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const person = value("person") || null;
    if (["project", "task"].includes(action.kind) && !value("name")) {
      setValidation("A name is required.");
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
          return taskService.createTask({
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
          return taskService.assignTask(task!.id, person, actorId);
        case "reschedule":
          return taskService.rescheduleTask(
            task!.id,
            value("due"),
            value("reason"),
            actorId,
          );
        case "submit":
          return taskService.submitTask(
            task!.id,
            actorId,
            value("description"),
            value("url") || undefined,
          );
        case "accept":
          return taskService.acceptTask(task!.id, actorId);
        case "return":
          return taskService.returnTask(task!.id, actorId, value("reason"));
        case "start":
          return taskService.updateTaskStatus(task!.id, "in_progress", actorId);
        case "cancel":
          return taskService.updateTaskStatus(task!.id, "cancelled", actorId);
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
      }
    };
    try {
      await mutation.mutateAsync(operation);
      onClose();
    } catch {
      /* Mutation error remains visible; preserve form values. */
    }
  }
  const personField = (
    rows: typeof people,
    label: string,
    defaultValue?: string | null,
    required = false,
  ) => (
    <Select
      name="person"
      label={label}
      data={options(rows)}
      defaultValue={defaultValue}
      searchable
      clearable={!required}
      required={required}
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
    >
      <form onSubmit={submit}>
        <Stack>
          {(validation || mutation.error) && (
            <Alert color="red" role="alert">
              {validation || mutation.error?.message}
            </Alert>
          )}
          {task && <Text fw={600}>{task.title}</Text>}
          {project && action.kind !== "task" && (
            <Text size="sm" c="dimmed">
              {project.name}
            </Text>
          )}
          {action.kind === "project" && (
            <>
              <TextInput
                name="name"
                label="Project name"
                required
                maxLength={200}
              />
              <Textarea
                name="description"
                label="Goal and expected outcome"
                required
              />
              <Group grow>
                <TextInput
                  name="start"
                  type="date"
                  label="Start date"
                  defaultValue={date}
                  required
                />
                <TextInput
                  name="end"
                  type="date"
                  label="Target date"
                  defaultValue={date}
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
                label="Project"
                data={data.projects
                  .filter((p) => p.state === "active")
                  .map((p) => ({ value: p.id, label: p.name }))}
                value={projectId || null}
                onChange={(v) => setProjectId(v ?? "")}
                searchable
                required
              />
              <TextInput
                name="name"
                label="Task title"
                required
                maxLength={200}
              />
              <Textarea
                name="description"
                label="Description and acceptance criteria"
              />
              <div key={projectId}>
                {personField(eligible, "Task owner (optional)")}
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
                  defaultValue="mid"
                  allowDeselect={false}
                  required
                />
                <Select
                  name="origin"
                  label="Origin"
                  data={["planned", "unplanned"]}
                  defaultValue="planned"
                  allowDeselect={false}
                  required
                />
              </Group>
              <TextInput
                name="due"
                label="Due date"
                type="date"
                defaultValue={date}
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
                defaultValue={task?.dueDate}
                required
              />
              <Textarea
                name="reason"
                label="Reason for rescheduling"
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
                defaultValue={task?.deliverableUrl ?? ""}
              />
              <Textarea
                name="description"
                label="Submission notes"
                defaultValue={task?.submissionNotes ?? ""}
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
            <Textarea name="reason" label="Required changes" required />
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
                defaultValue="external"
                allowDeselect={false}
                required
              />
              <Textarea
                name="reason"
                label="What is blocking delivery?"
                required
              />
              {personField(eligible, "Responsible person", undefined, true)}
              <Select
                name="dependency"
                label="Blocking task (optional)"
                data={data.tasks
                  .filter((t) => t.id !== task?.id && isTaskOpen(t.status))
                  .map((t) => ({ value: t.id, label: t.title }))}
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
                  defaultValue={date}
                  required
                />
                <TextInput
                  name="end"
                  type="date"
                  label="Last day"
                  defaultValue={date}
                  required
                />
              </Group>
              <Textarea name="description" label="Note" />
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
          <Group justify="flex-end">
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
                ["cancel", "remove-member", "close"].includes(action.kind)
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
