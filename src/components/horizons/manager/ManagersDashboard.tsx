import { useState } from "react";
import { Stack, Loader, Alert, Button, Group, Text } from "@mantine/core";

import {
  useManagerWorkspace,
  useManagerAction,
} from "../../../api/hooks/use-manager-workspace";
import { useAssignTask, useCreateTask } from "../../../api/hooks/use-tasks";
import {
  useManagerAcceptTask,
  useManagerReturnTask,
} from "../../../api/hooks/use-manager-actions";
import {
  notStartedDueSoon,
  openBlockersByAge,
  openWorkByPerson,
  projectForecasts,
  projectIdOfRecord,
  scopeToManagedProjects,
} from "../../../domain/calculations/manager-insights";
import type { TaskComplexity } from "../../../entities/task.entity";

import type { ManagerView } from "../../../types/dashboard";
import { ManagerTemplate } from "./templates/ManagerTemplate";
import {
  TeamOverviewHeader,
  type TeamOverviewMetrics,
} from "./kilos/TeamOverviewHeader";
import { getWorkingDaysElapsed } from "../../../domain/calculations/working-days";
import { SYSTEM_CONFIG } from "../../../domain/config/system-thresholds";
import { AcceptanceGate, type DeliverableRow } from "./kilos/AcceptanceGate";
import { AuditLedger, type LedgerDisplayRow } from "./kilos/AuditLedger";
import {
  OperationalRadar,
  type AttentionRadarItem,
} from "./kilos/OperationalRadar";
import {
  AssignWorkModal,
  type AssignWorkFormValues,
} from "../../modal/AssignWorkModal";
import { ReviewDeliverableModal } from "../../modal/ReviewDeliverableModal";
import { TaskLifecycleInspectorModal } from "../../modal/TaskLifecycleInspectorModal";
import type { RaiseBlockerFormValues } from "../../modal/RaiseBlockerModal";
import type { RescheduleTaskFormValues } from "../../modal/RescheduleTaskModal";
import { taskService, blockerService } from "../../../services";
import type { BlockerCategory } from "../../../entities/blocker.entity";
import { getManagerReviewQueue } from "./manager-utils";
import { ManagerTaskControls } from "./kilos/ManagerTaskControls";
import { ManagedProjectsPanel } from "./kilos/ManagedProjectsPanel";
import { DeliveryTrendsPanel } from "./kilos/DeliveryTrendsPanel";
import { ManagedTasksTable } from "./kilos/ManagedTasksTable";
import { WorkloadPanel } from "./kilos/WorkloadPanel";
import { DueSoonPanel } from "./kilos/DueSoonPanel";
import { OpenBlockersPanel } from "./kilos/OpenBlockersPanel";

const FORECAST_WEEKS = 4;

export default function ManagersDashboard({
  actorId,
  date = new Date().toISOString().slice(0, 10),
  view,
  onViewChange,
}: {
  actorId: string;
  date?: string;
  view: ManagerView;
  onViewChange: (view: ManagerView) => void;
}) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<DeliverableRow | null>(null);

  const [inspectedTaskId, setInspectedTaskId] = useState<string | null>(null);
  const query = useManagerWorkspace(date);
  const executeAction = useManagerAction();
  const createTaskMutation = useCreateTask();
  const assignTaskMutation = useAssignTask();
  const acceptTaskMutation = useManagerAcceptTask();
  const returnTaskMutation = useManagerReturnTask();
  const data = query.data;

  // 1. Action: Start Working (not_started -> in_progress)
  const handleStartWork = async (taskId: string) => {
    await executeAction.mutateAsync(async () => {
      await taskService.updateTaskStatus(taskId, "in_progress", actorId);
    });
  };

  // 2. Action: Submit for Acceptance Gate (in_progress -> submitted)
  const handleSubmitForGate = async (taskId: string) => {
    await executeAction.mutateAsync(async () => {
      await taskService.submitTask(
        taskId,
        actorId,
        "Delivered for manager gate verification",
      );
    });
    // Auto-close inspector or keep it updated
    setInspectedTaskId(null);
  };

  // 3. Action: Raise Blocker
  const handleRaiseBlocker = async (
    taskId: string,
    values: RaiseBlockerFormValues,
  ) => {
    await executeAction.mutateAsync(async () => {
      await blockerService.raiseBlocker({
        taskId,
        actorId,
        category: values.category as BlockerCategory,
        ownerId: values.resolverId,
        description: values.description,
      });
      await taskService.updateTaskStatus(taskId, "blocked", actorId);
    });
  };

  // 4. Action: Reschedule Due Date
  const handleReschedule = async (
    taskId: string,
    values: RescheduleTaskFormValues,
  ) => {
    await executeAction.mutateAsync(async () => {
      await taskService.rescheduleTask(
        taskId,
        values.newDueDate,
        values.reason,
        actorId,
      );
    });
  };

  // 3. Inspect Click Handler: match the risk signal to its task
  const handleInspectRisk = (risk: AttentionRadarItem) => {
    const taskId = data?.signals.attentionItems.find(
      (item) => item.id === risk.id,
    )?.taskId;

    if (taskId) setInspectedTaskId(taskId);
  };

  if (!data) {
    return (
      <Stack p="xl">
        {query.isPending ? (
          <Group>
            <Loader size="sm" />
            <Text role="status">Loading manager workspace…</Text>
          </Group>
        ) : (
          <Alert color="red" title="Could not load manager workspace">
            {query.error?.message}
            <Button mt="sm" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </Alert>
        )}
      </Stack>
    );
  }

  // Lookup Maps
  const personName = (id: string | null | undefined) =>
    data.people.find((p) => p.id === id)?.name ?? "Unassigned";
  const projectName = (id: string | null | undefined) =>
    data.projects.find((p) => p.id === id)?.name ?? "Unknown Project";

  // FR-50: the page only covers projects this manager manages.
  const scope = scopeToManagedProjects(actorId, {
    projects: data.projects,
    tasks: data.tasks,
    blockers: data.blockers,
    ledger: data.ledger,
  });
  const managedProjectIds = new Set(scope.projects.map((p) => p.id));

  // 1. Data Mapping: Manager Acceptance Gate (Image 3)
  const submittedTasks: DeliverableRow[] = getManagerReviewQueue(
    scope.tasks,
  ).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    projectName: projectName(t.projectId),
    submittedByName: personName(t.assigneeId),
    complexity: t.complexity ?? "mid",
    rawTask: t,
  }));

  // 2. Data Mapping: Audit Ledger Rows (Image 2)
  const auditRows: LedgerDisplayRow[] = scope.ledger.map((record) => {
    let transition = record.reason || "Updated";
    if (record.fromValue && record.toValue) {
      transition = `${record.fromValue} → ${record.toValue}`;
    } else if (record.subjectType === "task") {
      const relatedTask = data.tasks.find((t) => t.id === record.subjectId);
      transition = relatedTask ? relatedTask.title : record.subjectId;
    }

    return {
      id: record.id,
      occurredAt: record.occurredAt,
      actorId: record.actorId,
      projectId: projectIdOfRecord(record, scope),
      actorName: personName(record.actorId),
      eventType: record.type,
      transition,
      justification: record.reason || "Planned task created",
    };
  });

  // 3. Data Mapping: Operational Attention Radar (Image 4)
  const attentionItems: AttentionRadarItem[] = (
    data.signals?.attentionItems ?? []
  )
    .filter((item) => item.projectId && managedProjectIds.has(item.projectId))
    .map((item) => ({
    id: item.id,
    headline: item.headline,
    details: item.details,
    projectName: item.projectName,
    assigneeName: item.assigneeName || "Unassigned",
    severity: item.severity === "critical" ? "critical" : "warning",
    signalType: item.signalType as AttentionRadarItem["signalType"],
  }));

  // 4. Data Mapping: Metrics (Image 1)
  const activeBlockers = scope.blockers.filter((b) => !b.clearedAt);
  const blockerRows = openBlockersByAge(scope.blockers, scope.tasks, date);
  const dueSoonRows = notStartedDueSoon(scope.tasks, date);
  const workloadRows = openWorkByPerson(scope.tasks, data.people);
  const forecastRows = projectForecasts(scope.projects, scope.tasks, scope.ledger, date, FORECAST_WEEKS);
  // Team overview cards: real figures for the manager's own projects only.
  const waitingDays = scope.tasks
    .filter((t) => t.status === "submitted" && t.submittedAt)
    .map((t) => getWorkingDaysElapsed(t.submittedAt!, date));
  const overviewMetrics: TeamOverviewMetrics = {
    reviewQueueCount: submittedTasks.length,
    oldestWaitingDays: waitingDays.length ? Math.max(...waitingDays) : null,
    activeBlockersCount: activeBlockers.length,
    agingBlockersCount: blockerRows.filter(
      (r) => r.daysOpen > SYSTEM_CONFIG.AGING_BLOCKER_WORKING_DAYS,
    ).length,
    openWeight: workloadRows.reduce((sum, r) => sum + r.openWeight, 0),
    openPeopleCount: workloadRows.filter((r) => r.personId !== null).length,
    agingWipCount: attentionItems.filter((i) => i.signalType === "aging_wip").length,
  };

  // Handlers
  const normalizeComplexity = (value: string): TaskComplexity => {
    const normalized = value
      .toLowerCase()
      .replace(/\s*\(\d+\s*pt\)\s*$/i, "")
      .trim();

    if (normalized === "low") return "low";
    if (normalized === "mid" || normalized === "medium") return "mid";
    if (normalized === "high" || normalized === "critical") return "high";

    return "mid";
  };

  const handleAssignWork = async (values: AssignWorkFormValues) => {
    await executeAction.mutateAsync(async () => {
      const created = await createTaskMutation.mutateAsync({
        title: values.title,
        projectId: values.projectId,
        description: values.justification,
        assigneeId: values.assigneeId,
        complexity: normalizeComplexity(values.complexity),
        dueDate: values.dueDate,
        origin: "planned",
        actorId,
      });

      await assignTaskMutation.mutateAsync({
        taskId: created.id,
        assigneeId: values.assigneeId,
        actorId,
      });
    });
  };

  const handleAcceptDeliverable = async (
    deliverable: DeliverableRow,
    _note: string,
  ) => {
    await acceptTaskMutation.mutateAsync({
      taskId: deliverable.id,
      actorId,
    });
    setReviewItem(null);
  };

  const handleReturnDeliverable = async (
    deliverable: DeliverableRow,
    note: string,
  ) => {
    await returnTaskMutation.mutateAsync({
      taskId: deliverable.id,
      actorId,
      reason: note,
    });
    setReviewItem(null);
  };

  return (
    <ManagerTemplate>
      {/* SECTION 1: TEAM OVERVIEW (IMAGE 1) */}
      <TeamOverviewHeader
        metrics={view === "overview" ? overviewMetrics : undefined}
        onAssignWork={
          view === "overview" || view === "tasks" || view === "projects"
            ? () => setIsAssignOpen(true)
            : undefined
        }
        onReviewSubmissions={
          view === "overview" ? () => onViewChange("review_gate") : undefined
        }
      />

      {/* SECTION 2: ACCEPTANCE GATE (IMAGE 3) */}
      {(view === "overview" || view === "review_gate") && (
        <AcceptanceGate
          deliverables={submittedTasks}
          onReviewDeliverable={(del) => setReviewItem(del)}
          loading={query.isFetching || executeAction.isPending}
        />
      )}

      {/* SECTION 3: OPERATIONAL RADAR */}
      {(view === "overview" || view === "risk_queue") && (
        <OperationalRadar
          items={attentionItems}
          onInspect={handleInspectRisk}
        />
      )}

      {view === "risk_queue" && (
        <>
          <DueSoonPanel rows={dueSoonRows} projects={scope.projects} people={data.people} onTaskClick={setInspectedTaskId} />
          <OpenBlockersPanel rows={blockerRows} people={data.people} onTaskClick={setInspectedTaskId} />
        </>
      )}

      {view === "projects" && (
        <>
          <ManagedProjectsPanel rows={forecastRows} actorId={actorId} date={date} recentWeeks={FORECAST_WEEKS} />
          <DeliveryTrendsPanel tasks={scope.tasks} ledger={scope.ledger} date={date} />
        </>
      )}

      {view === "tasks" && (
        <ManagedTasksTable
          tasks={scope.tasks}
          projects={scope.projects}
          people={data.people}
          onTaskClick={setInspectedTaskId}
        />
      )}

      {view === "workload" && <WorkloadPanel rows={workloadRows} />}

      {/* SECTION 1.2: AUDIT LEDGER (IMAGE 2) */}
      {(view === "overview" || view === "change_feed") && (
        <AuditLedger
          ledgerRows={auditRows}
          loading={query.isFetching || executeAction.isPending}
          projects={scope.projects}
          people={data.people}
        />
      )}

      {/* ASSIGN WORK MODAL */}
      <AssignWorkModal
        opened={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSubmit={handleAssignWork}
        loading={executeAction.isPending}
        projects={data.projects}
        people={data.people}
      />

      {/* REVIEW DELIVERABLE MODAL */}
      <ReviewDeliverableModal
        deliverable={reviewItem}
        onClose={() => setReviewItem(null)}
        onAccept={handleAcceptDeliverable}
        onReturn={handleReturnDeliverable}
        loading={acceptTaskMutation.isPending || returnTaskMutation.isPending}
      />

      {/* 4. THE DIAGNOSTIC & LIFECYCLE MODAL */}
      <TaskLifecycleInspectorModal
        taskId={inspectedTaskId}
        opened={!!inspectedTaskId}
        onClose={() => setInspectedTaskId(null)}
        data={data}
        onStartWork={handleStartWork}
        onSubmitForGate={handleSubmitForGate}
        onRaiseBlocker={handleRaiseBlocker}
        onReschedule={handleReschedule}
        loading={executeAction.isPending}
        renderManagerControls={(task) => (
          <ManagerTaskControls
            task={task}
            people={data.people}
            members={data.members}
            projectManagerId={data.projects.find((p) => p.id === task.projectId)?.managerId ?? null}
            actorId={actorId}
          />
        )}
      />
    </ManagerTemplate>
  );
}
