import { useState } from "react";
import { Stack, Loader, Alert, Button, Group, Text } from "@mantine/core";

import {
  useManagerWorkspace,
  useManagerAction,
} from "../../../api/hooks/use-manager-workspace";
import {
  useAcceptTask,
  useAssignTask,
  useCreateTask,
  useReturnTask,
} from "../../../api/hooks/use-tasks";
import type { TaskComplexity } from "../../../entities/task.entity";

import type { ManagerView } from "../../../types/dashboard";
import { ManagerTemplate } from "./templates/ManagerTemplate";
import { TeamOverviewHeader } from "./kilos/TeamOverviewHeader";
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
  const acceptTaskMutation = useAcceptTask();
  const returnTaskMutation = useReturnTask();
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

  // 1. Data Mapping: Manager Acceptance Gate (Image 3)
  const submittedTasks: DeliverableRow[] = getManagerReviewQueue(
    data.tasks,
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
  const auditRows: LedgerDisplayRow[] = data.ledger.map((record) => {
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
      actorName: personName(record.actorId),
      eventType: record.type,
      transition,
      justification: record.reason || "Planned task created",
    };
  });

  // 3. Data Mapping: Operational Attention Radar (Image 4)
  const attentionItems: AttentionRadarItem[] = (
    data.signals?.attentionItems ?? []
  ).map((item) => ({
    id: item.id,
    headline: item.headline,
    details: item.details,
    projectName: item.projectName,
    assigneeName: item.assigneeName || "Unassigned",
    severity: item.severity === "critical" ? "critical" : "warning",
    signalType: item.signalType as AttentionRadarItem["signalType"],
  }));

  // 4. Data Mapping: Metrics (Image 1)
  const activeBlockers = data.blockers.filter((b) => !b.clearedAt);
  const agingWipCount =
    data.signals?.attentionItems?.filter((i) => i.signalType === "aging_wip")
      .length ?? 0;
  const capacityPercent =
    data.signals?.orgMetrics?.unplannedCapacityPercent ?? 82;

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
      managerId: actorId,
    });
    setReviewItem(null);
  };

  const handleReturnDeliverable = async (
    deliverable: DeliverableRow,
    note: string,
  ) => {
    await returnTaskMutation.mutateAsync({
      taskId: deliverable.id,
      managerId: actorId,
      reason: note,
    });
    setReviewItem(null);
  };

  return (
    <ManagerTemplate>
      {/* SECTION 1: TEAM OVERVIEW (IMAGE 1) */}
      <TeamOverviewHeader
        reviewQueueCount={submittedTasks.length}
        activeBlockersCount={activeBlockers.length}
        capacityPercent={capacityPercent}
        totalMembersCount={data.people.length}
        agingWipCount={agingWipCount}
        onAssignWork={() => setIsAssignOpen(true)}
        onReviewSubmissions={() => onViewChange("review_gate")}
        onNavigateToRisk={() => onViewChange("risk_queue")}
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

      {/* SECTION 1.2: AUDIT LEDGER (IMAGE 2) */}
      {view === "overview" && (
        <AuditLedger
          ledgerRows={auditRows}
          loading={query.isFetching || executeAction.isPending}
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
      />
    </ManagerTemplate>
  );
}
