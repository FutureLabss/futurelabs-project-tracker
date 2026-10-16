import { useState, type ComponentProps } from "react";
import type { TaskStatus } from "../../../entities/task.entity";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconLayoutKanban,
  IconTable,
} from "@tabler/icons-react";
import {
  useAdminWorkspace,
  useAdminAction,
} from "../../../api/hooks/use-admin-workspace";
import { useCanResetDemo, useResetToSeed } from "../../../api/hooks/use-signals";
import { taskService } from "../../../services";
import { TaskBoard } from "../../task-board";
import type { AdminView } from "../../../types/dashboard";
import type { LedgerRecord } from "../../../entities/ledger-record.entity";
import { AdminActionDialog, type AdminAction } from "./AdminActionDialog";
import { AdminDetails, LedgerList, TaskList } from "./AdminDetails";
import {
  type AnalyticsPreset,
  type DateRange,
  calculatePeriodAnalytics,
  calculatePeriodMetrics,
  computeDateRange,
  downloadCsv,
  isOpen,
  localDay,
  readable,
} from "./admin-utils";
import dayjs from "dayjs";
import {
  acceptanceEvents,
  blockerCategoryReport,
  monthlyDelivery,
} from "../../../domain/calculations/admin-insights";
import { MetricCard } from "./atoms/MetricCard";
import { EmptyState } from "./atoms/EmptyState";
import { RiskSignalCard } from "./molecules/RiskSignalCard";
import { LedgerRecordModal } from "./molecules/LedgerRecordModal";
import { PortfolioTable } from "./organisms/PortfolioTable";
import { GovernancePanel } from "./organisms/GovernancePanel";
import { PeopleGrid } from "./organisms/PeopleGrid";
import { AnalyticsPanel } from "./organisms/AnalyticsPanel";
import { AdminTemplate } from "./templates/AdminTemplate";
import { RiskWatchlists } from "./organisms/RiskWatchlists";
import { inactiveProjects, unattendedTasks } from "../../../domain/calculations/admin-insights";

const headings: Record<AdminView, [string, string]> = {
  portfolio: [
    "Portfolio operations",
    "Project health, delivery ownership, and outcomes across your organization.",
  ],
  my_work: [
    "My work",
    "Tasks assigned to you. Start, submit, raise blockers and reschedule them like any team member.",
  ],
  analytics: [
    "Delivery analytics",
    "Accepted outcomes, rework, capacity, and the causes of delivery delays.",
  ],
  governance: [
    "Governance",
    "Assign accountable leads and owners, and keep the review queue moving.",
  ],
  risks: [
    "Organization risks",
    "Investigate overdue work, aging blockers, and stalled delivery.",
  ],
  tasks: [
    "All tasks",
    "Plan work, inspect deliverables, and manage the full task lifecycle.",
  ],
  people: [
    "Team directory",
    "Inspect workload, availability, and project participation.",
  ],
  ledger: [
    "Activity ledger",
    "Recorded changes, accountable actors, and the reasons behind decisions.",
  ],
};
export default function AdminDashboard({
  actorId,
  date,
  view,
  onViewChange,
}: {
  actorId: string;
  date: string;
  view: AdminView;
  onViewChange: (view: AdminView) => void;
}) {
  const query = useAdminWorkspace(date);
  const canResetDemo = useCanResetDemo();
  const resetMutation = useResetToSeed();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Partial<Record<AdminView, string>>>(
    {},
  );
  // FR-51: the portfolio lists active projects unless another filter is chosen.
  const filter = filters[view] ?? (view === "portfolio" ? "active" : "all");
  const setFilter = (value: string) =>
    setFilters((current) => ({ ...current, [view]: value }));
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [report, setReport] = useState("throughput");
  const [action, setAction] = useState<AdminAction | null>(null);
  const [selection, setSelection] = useState<{
    type: "project" | "task" | "person";
    id: string;
  } | null>(null);
  const [record, setRecord] = useState<LedgerRecord | null>(null);
  const [exportError, setExportError] = useState("");
  const [exportNotice, setExportNotice] = useState("");
  const [taskViewMode, setTaskViewMode] = useState<"board" | "table">("board");
  const adminActionMutation = useAdminAction();

  const [analyticsPreset, setAnalyticsPreset] = useState<AnalyticsPreset>("30d");
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: dayjs(date).subtract(30, "day").format("YYYY-MM-DD"),
    endDate: date,
  });

  const data = query.data;
  const changeView = (next: AdminView, nextFilter = "all") => {
    setSearch("");
    setFilters((current) => ({ ...current, [next]: nextFilter }));
    setProjectFilter(null);
    onViewChange(next);
  };
  const onProject = (id: string) => setSelection({ type: "project", id });
  const onTask = (id: string) => setSelection({ type: "task", id });
  const onPerson = (id: string) => setSelection({ type: "person", id });
  if (!data)
    return (
      <Stack p="xl">
        {query.isPending ? (
          <Group>
            <Loader size="sm" />
            <Text role="status">Loading admin workspace…</Text>
          </Group>
        ) : (
          <Alert color="red" title="Could not load admin workspace">
            {query.error?.message}
            <Button mt="sm" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </Alert>
        )}
      </Stack>
    );
  const matches = (...values: (string | undefined | null)[]) =>
    values.join(" ").toLowerCase().includes(search.toLowerCase());
  const personName = (id: string | null) =>
    data.people.find((p) => p.id === id)?.name ?? "Unassigned";
  const projectName = (id: string) =>
    data.projects.find((p) => p.id === id)?.name ?? "Unknown project";
  const activeProjects = data.projects.filter((p) => p.state === "active");
  const summaryOf = (projectId: string) =>
    data.signals.projectSummaries.find((s) => s.projectId === projectId);
  // FR-52: most at risk first (red, amber, green, then closed), then the
  // project with more reasons, then the nearest target date.
  const riskRank = (p: (typeof data.projects)[number]) =>
    p.state === "closed" ? 3 : { red: 0, amber: 1, green: 2 }[summaryOf(p.id)?.ragStatus ?? "green"];
  const projects = data.projects
    .filter(
      (p) =>
        matches(p.name, p.goal, personName(p.managerId)) &&
        (filter === "all" ||
          filter === p.state ||
          (filter === "unmanaged" && !p.managerId && p.state === "active") ||
          (p.state === "active" && filter === summaryOf(p.id)?.ragStatus)),
    )
    .sort(
      (a, b) =>
        riskRank(a) - riskRank(b) ||
        (riskRank(a) < 2 ? (summaryOf(b.id)?.ragReasons.length ?? 0) - (summaryOf(a.id)?.ragReasons.length ?? 0) : 0) ||
        a.targetDate.localeCompare(b.targetDate),
    );
  const tasks = data.tasks.filter(
    (t) =>
      matches(
        t.title,
        t.description,
        projectName(t.projectId),
        personName(t.assigneeId),
      ) &&
      (!projectFilter || t.projectId === projectFilter) &&
      (filter === "all" ||
        filter === t.status ||
        (filter === "unassigned" && !t.assigneeId && isOpen(t))),
  );
  // The admin's own open work, earliest due date first.
  const myTasks = data.tasks
    .filter(
      (t) =>
        t.assigneeId === actorId &&
        isOpen(t) &&
        matches(t.title, t.description, projectName(t.projectId)),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const risks = data.signals.attentionItems.filter(
    (r) =>
      matches(r.headline, r.details, r.projectName, r.assigneeName) &&
      (filter === "all" || filter === r.signalType) &&
      (!projectFilter || r.projectId === projectFilter),
  );
  // FR-54 / FR-55 watchlists, following the Risks view's project filter and search.
  const unattended = unattendedTasks(data.tasks, data.blockers, data.ledger, date).filter(
    (r) =>
      (!projectFilter || r.task.projectId === projectFilter) &&
      matches(r.task.title, projectName(r.task.projectId), personName(r.task.assigneeId)),
  );
  const inactive = inactiveProjects(data.projects, data.tasks, data.blockers, data.ledger, date).filter(
    (r) =>
      (!projectFilter || r.project.id === projectFilter) &&
      matches(r.project.name, personName(r.project.managerId)),
  );
  const people = data.people.filter((p) =>
    matches(p.name, p.email, p.title, p.role),
  );
  const ledger = data.ledger.filter(
    (r) =>
      matches(
        readable(r.type),
        r.reason,
        personName(r.actorId),
        r.fromValue,
        r.toValue,
      ) &&
      (filter === "all" || filter === r.subjectType),
  );

  const effectiveRange = computeDateRange(analyticsPreset, date, customRange);
  // Same source as Analytics: acceptances from the change log, so reopened work still counts.
  const last30 = calculatePeriodMetrics(data, computeDateRange("30d", date));
  const acceptedLast30 = { count: last30.acceptedCount, weight: last30.acceptedWeight };
  const periodAnalytics = {
    ...calculatePeriodAnalytics(data, effectiveRange, projectFilter),
    currentRange: effectiveRange,
  };

  // Task lists behind each analytics report, using the same rules as the figures.
  const inPeriod = (timestamp: string) => {
    const day = localDay(timestamp);
    return day >= effectiveRange.startDate && day <= effectiveRange.endDate;
  };
  const reportTaskIds = new Set(
    data.ledger
      .filter((r) => {
        if (!inPeriod(r.occurredAt)) return false;
        if (report === "rework") return r.type === "task_returned" || r.type === "task_reopened";
        if (report !== "slips") return false;
        return r.type === "task_redated" && !!r.fromValue && !!r.toValue && r.toValue > r.fromValue;
      })
      .map((r) => r.subjectId),
  );
  if (report === "throughput")
    for (const e of acceptanceEvents(data.tasks, data.ledger)) if (inPeriod(e.occurredAt)) reportTaskIds.add(e.taskId);
  const reportTasks = data.tasks.filter(
    (t) =>
      matches(t.title, projectName(t.projectId), personName(t.assigneeId)) &&
      (!projectFilter || t.projectId === projectFilter) &&
      (report === "unplanned"
        ? t.origin === "unplanned" && inPeriod(t.createdAt)
        : report === "blockers"
          ? data.blockers.some(
              (b) =>
                b.taskId === t.id &&
                inPeriod(b.raisedAt) &&
                (filter === "all" || b.category === filter),
            )
          : reportTaskIds.has(t.id)),
  );
  const analyticsTasks = projectFilter
    ? data.tasks.filter((t) => t.projectId === projectFilter)
    : data.tasks;
  const monthlyRows = monthlyDelivery(analyticsTasks, data.ledger, date, 6);
  const blockerReport = blockerCategoryReport(data.blockers, analyticsTasks, data.projects, effectiveRange);
  const exportRows = (): unknown[][] => {
    if (view === "portfolio" || view === "governance")
      return [
        [
          "Project",
          "Goal",
          "Lead",
          "State",
          "Start",
          "Target",
          "Health",
          "Open tasks",
          "Overdue",
          "Blocked",
          "Slips",
        ],
        ...projects.map((p) => {
          const s = data.signals.projectSummaries.find(
            (s) => s.projectId === p.id,
          );
          return [
            p.name,
            p.goal,
            personName(p.managerId),
            p.state,
            p.startDate,
            p.targetDate,
            s?.ragStatus,
            s?.openTasksCount,
            s?.overdueTasksCount,
            s?.blockedTasksCount,
            s?.slipCount,
          ];
        }),
      ];
    if (view === "risks")
      return [
        ["Signal", "Severity", "Project", "Task", "Owner", "Details"],
        ...risks.map((r) => [
          r.signalType,
          r.severity,
          r.projectName,
          r.taskTitle,
          r.assigneeName,
          r.details,
        ]),
      ];
    if (view === "people")
      return [
        ["Name", "Email", "Role", "Status", "Open tasks", "Open work (complexity points)"],
        ...people.map((p) => [
          p.name,
          p.email,
          p.role,
          p.status ?? "active",
          data.signals.memberSummaries[p.id]?.activeTasksCount ?? 0,
          data.signals.memberSummaries[p.id]?.totalComplexityWeight ?? 0,
        ]),
      ];
    if (view === "ledger")
      return [
        [
          "Time",
          "Event",
          "Actor",
          "Subject type",
          "Subject ID",
          "From",
          "To",
          "Reason",
        ],
        ...ledger.map((r) => [
          r.occurredAt,
          r.type,
          personName(r.actorId),
          r.subjectType,
          r.subjectId,
          r.fromValue,
          r.toValue,
          r.reason,
        ]),
      ];
    if (view === "analytics") {
      const summaryRows = [
        ["Report Scope", "Delivery Analytics"],
        ["Reporting Date", date],
        [
          "Date Window",
          `${effectiveRange.startDate} to ${effectiveRange.endDate} (${analyticsPreset})`,
        ],
        ["Active Report Tab", report],
        [
          "Project Filter",
          projectFilter ? projectName(projectFilter) : "All Projects",
        ],
        ["Org Total Tasks", data.tasks.length],
        ["Filtered View Tasks", reportTasks.length],
        [],
        ["Summary Metric", "Current Period", "Previous Period", "Trend Delta"],
        [
          "Accepted Deliverables",
          periodAnalytics?.current.acceptedCount ?? 0,
          periodAnalytics?.previous.acceptedCount ?? 0,
          periodAnalytics?.trends.acceptedDelta ?? 0,
        ],
        [
          "Complexity Points Delivered",
          periodAnalytics?.current.acceptedWeight ?? 0,
          periodAnalytics?.previous.acceptedWeight ?? 0,
          periodAnalytics?.trends.weightDelta ?? 0,
        ],
        [
          "Rework Rate (%)",
          `${(periodAnalytics?.current.reworkRatePercent ?? 0).toFixed(1)}%`,
          `${(periodAnalytics?.previous.reworkRatePercent ?? 0).toFixed(1)}%`,
          `${(periodAnalytics?.trends.reworkRateDelta ?? 0).toFixed(1)}%`,
        ],
        [
          "Date Changes / Slips",
          periodAnalytics?.current.dateChanges ?? 0,
          periodAnalytics?.previous.dateChanges ?? 0,
          periodAnalytics?.trends.dateChangesDelta ?? 0,
        ],
        [],
      ];

      if (report === "breakdown" && periodAnalytics) {
        return [
          ...summaryRows,
          [
            "Project",
            "Lead",
            "Accepted in Period",
            "Delivered Points",
            "Returned or Reopened",
            "Due Dates Moved Later",
            "Open Tasks",
          ],
          ...periodAnalytics.projectBreakdown.map((p) => [
            p.projectName,
            p.managerName,
            p.acceptedCount,
            p.acceptedWeight,
            p.returnsCount,
            p.dateChangesCount,
            p.openTasksCount,
          ]),
        ];
      }

      return [
        ...summaryRows,
        [
          "Task",
          "Project",
          "Owner",
          "Status",
          "Complexity",
          "Origin",
          "Due",
          "Submitted",
          "Accepted",
        ],
        ...reportTasks.map((t) => [
          t.title,
          projectName(t.projectId),
          personName(t.assigneeId),
          t.status,
          t.complexity,
          t.origin,
          t.dueDate,
          t.submittedAt,
          t.acceptedAt,
        ]),
      ];
    }
    return [
      [
        "Task",
        "Project",
        "Owner",
        "Status",
        "Complexity",
        "Origin",
        "Due",
        "Submitted",
        "Accepted",
      ],
      ...(view === "my_work" ? myTasks : tasks).map((t) => [
        t.title,
        projectName(t.projectId),
        personName(t.assigneeId),
        t.status,
        t.complexity,
        t.origin,
        t.dueDate,
        t.submittedAt,
        t.acceptedAt,
      ]),
    ];
  };
  function exportReport() {
    try {
      setExportError("");
      downloadCsv(
        `tracker-${view}${view === "analytics" ? `-${report}` : ""}-${date}.csv`,
        exportRows(),
      );
      setExportNotice("CSV export prepared from the current view.");
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Could not export report.",
      );
    }
  }
  // Board buttons open the matching action dialog; start, submit and raise
  // blocker only appear on the admin's own tasks (canDoMemberActions).
  const onBoardAction = (
    req: Parameters<NonNullable<ComponentProps<typeof TaskBoard>["onTaskActionRequired"]>>[0],
  ) => {
    if (req.kind === "clear") setAction({ kind: "clear", blockerId: req.blockerId });
    else setAction({ kind: req.kind, taskId: req.taskId });
  };
  const onBoardStatusChange = async (taskId: string, targetStatus: TaskStatus) => {
    await adminActionMutation.mutateAsync(() =>
      taskService.updateTaskStatus(taskId, targetStatus, actorId),
    );
  };
  const projectSelect = (
    <Select
      label="Project"
      placeholder="All projects"
      clearable
      searchable
      data={data.projects.map((p) => ({ value: p.id, label: p.name }))}
      value={projectFilter}
      onChange={setProjectFilter}
      maw={360}
    />
  );
  return (
    <AdminTemplate
      title={headings[view][0]}
      subtitle={headings[view][1]}
      date={date}
      isFetching={query.isFetching}
      onRefresh={() => void query.refetch()}
      onExport={exportReport}
      // Portfolio is the admin home: only it carries New project, Reset demo and the summary cards.
      onNewProject={view === "portfolio" ? () => setAction({ kind: "project" }) : undefined}
      onResetDemo={view === "portfolio" ? () => setResetModalOpen(true) : undefined}
      canResetDemo={canResetDemo}
      queryError={query.isError ? query.error.message : undefined}
      exportError={exportError}
      exportNotice={exportNotice}
      onClearExportNotice={() => setExportNotice("")}
      metricsGrid={
        view === "portfolio" && (
        <SimpleGrid cols={{ base: 1, xs: 2, xl: 4 }}>
          <MetricCard
            label="Active projects"
            value={activeProjects.length}
            detail={`${activeProjects.filter((p) => !p.managerId).length} without a lead`}
          />
          <MetricCard
            label="Accepted in 30 days"
            value={acceptedLast30.count}
            detail={`${acceptedLast30.weight} complexity points`}
          />
          <MetricCard
            label="Review queue"
            value={data.tasks.filter((t) => t.status === "submitted").length}
            detail="Submitted deliverables awaiting acceptance"
          />
          <MetricCard
            label="Critical risks"
            value={data.signals.attentionItems.filter((r) => r.severity === "critical")
              .length}
            detail="Signals requiring investigation"
          />
        </SimpleGrid>
        )
      }
      controls={
        <TextInput
          label="Search current view"
          placeholder="Search projects, tasks, people, or changes"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      }
      actionDialog={
        action && (
          <AdminActionDialog
            action={action}
            data={data}
            actorId={actorId}
            date={date}
            onClose={() => setAction(null)}
          />
        )
      }
      detailsDrawer={
        selection && (
          <AdminDetails
            selection={selection}
            data={data}
            onClose={() => setSelection(null)}
            onProject={onProject}
            onTask={onTask}
            onPerson={onPerson}
            onAction={setAction}
            onRecord={setRecord}
            actorId={actorId}
          />
        )
      }
    >
      {view === "portfolio" && (
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <SegmentedControl
              size="sm"
              value={filter}
              onChange={(v) => setFilter(v)}
              data={[
                { value: "all", label: `All (${data.projects.length})` },
                { value: "active", label: `Active (${activeProjects.length})` },
                { value: "green", label: "On Track" },
                { value: "amber", label: "Attention" },
                { value: "red", label: "At Risk" },
                {
                  value: "unmanaged",
                  label: `Needs Lead (${activeProjects.filter((p) => !p.managerId).length})`,
                },
                {
                  value: "closed",
                  label: `Closed (${data.projects.filter((p) => p.state === "closed").length})`,
                },
              ]}
            />
          </Group>

          <PortfolioTable
            projects={projects}
            data={data}
            onProject={onProject}
            onPerson={onPerson}
            onAssignLead={(projectId) => setAction({ kind: "lead", projectId })}
          />
        </Stack>
      )}
      {view === "my_work" && (
        <Stack gap="md">
          <Group justify="flex-end">
            <Button
              onClick={() => setAction({ kind: "task", personId: actorId })}
              disabled={!activeProjects.length}
            >
              Create task for me
            </Button>
          </Group>
          <TaskBoard
            tasks={myTasks}
            projects={data.projects}
            people={data.people}
            onTaskClick={onTask}
            canDoMemberActions={(task) => task.assigneeId === actorId}
            today={date}
            onTaskStatusChange={onBoardStatusChange}
            onTaskActionRequired={onBoardAction}
            onCreateTask={() => setAction({ kind: "task", personId: actorId })}
            storageKey="futurelabs_admin_my_work_cols_v1"
          />
        </Stack>
      )}
      {view === "tasks" && (
        <>
          <Group align="flex-end" justify="space-between" wrap="wrap" gap="sm">
            <Group align="flex-end" gap="sm" wrap="wrap">
              {projectSelect}
              <Select
                label="Task status"
                value={filter}
                onChange={(v) => setFilter(v ?? "all")}
                data={[
                  "all",
                  "unassigned",
                  "not_started",
                  "in_progress",
                  "blocked",
                  "submitted",
                  "accepted",
                  "cancelled",
                ].map((value) => ({ value, label: readable(value) }))}
              />
            </Group>
            <Group align="flex-end" gap="sm" wrap="nowrap">
              <SegmentedControl
                value={taskViewMode}
                onChange={(val) => setTaskViewMode(val as "board" | "table")}
                data={[
                  {
                    value: "board",
                    label: (
                      <Group gap={6} wrap="nowrap">
                        <IconLayoutKanban size={15} />
                        <span>Board</span>
                      </Group>
                    ),
                  },
                  {
                    value: "table",
                    label: (
                      <Group gap={6} wrap="nowrap">
                        <IconTable size={15} />
                        <span>Table</span>
                      </Group>
                    ),
                  },
                ]}
              />
              <Button
                onClick={() =>
                  setAction({
                    kind: "task",
                    projectId: projectFilter ?? undefined,
                  })
                }
                disabled={!activeProjects.length}
              >
                Create task
              </Button>
            </Group>
          </Group>

          {taskViewMode === "board" ? (
            <TaskBoard
              tasks={tasks}
              projects={data.projects}
              people={data.people}
              onTaskClick={onTask}
              canDoMemberActions={(task) => task.assigneeId === actorId}
              today={date}
              onTaskStatusChange={onBoardStatusChange}
              onTaskActionRequired={onBoardAction}
              onCreateTask={() =>
                setAction({
                  kind: "task",
                  projectId: projectFilter ?? undefined,
                })
              }
            />
          ) : (
            <Card withBorder>
              <TaskList tasks={tasks} data={data} onTask={onTask} />
            </Card>
          )}
        </>
      )}
      {view === "governance" && (
        <>
          <GovernancePanel
            data={data}
            unmanagedProjects={activeProjects.filter(
              (p) => !p.managerId && matches(p.name),
            )}
            activeProjectsCount={activeProjects.length}
            managedProjectsCount={
              activeProjects.filter((p) => p.managerId).length
            }
            unassignedTasks={data.tasks.filter(
              (t) =>
                !t.assigneeId &&
                isOpen(t) &&
                matches(t.title, projectName(t.projectId)),
            )}
            submittedTasks={data.tasks.filter(
              (t) =>
                t.status === "submitted" &&
                matches(t.title, projectName(t.projectId)),
            )}
            onProject={onProject}
            onTask={onTask}
            onAssignLead={(projectId) => setAction({ kind: "lead", projectId })}
            onChangeView={changeView}
          />
        </>
      )}
      {view === "risks" && (
        <Stack gap="md">
          <Card withBorder p="sm" radius="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="sm" wrap="wrap" align="center">
                {projectSelect}
                <Select
                  label="Signal"
                  value={filter}
                  onChange={(v) => setFilter(v ?? "all")}
                  data={[
                    "all",
                    "silent_overrun",
                    "overdue",
                    "aging_wip",
                    "aging_blocker",
                    "returned_for_rework",
                    "unowned_task",
                    "unmanaged_project",
                  ].map((value) => ({ value, label: readable(value) }))}
                  maw={260}
                />
              </Group>

              <Group gap="xs">
                <Badge
                  size="md"
                  variant="light"
                  color={risks.length ? "red" : "teal"}
                >
                  {risks.length} active {risks.length === 1 ? "risk" : "risks"}
                </Badge>
                {risks.filter((r) => r.severity === "critical").length > 0 && (
                  <Badge size="sm" variant="filled" color="red">
                    {risks.filter((r) => r.severity === "critical").length} critical
                  </Badge>
                )}
              </Group>
            </Group>
          </Card>

          <RiskWatchlists
            unattended={unattended}
            inactive={inactive}
            projectName={projectName}
            personName={personName}
            onTask={onTask}
            onProject={onProject}
          />

          {!risks.length && (
            <Card withBorder p="xl" radius="md">
              <EmptyState message="No matching risks for this reporting date." />
            </Card>
          )}
          {risks.map((r) => (
            <RiskSignalCard
              key={r.id}
              risk={r}
              onInvestigate={(id, type) => {
                if (type === "task") onTask(id);
                else onProject(id);
              }}
            />
          ))}
        </Stack>
      )}
      {view === "analytics" && (
        <>
          <AnalyticsPanel
            data={data}
            blockerAnalytics={data.signals.blockerAnalytics}
            blockerReport={blockerReport}
            monthlyRows={monthlyRows}
            reportTasks={reportTasks}
            report={report}
            filter={filter}
            onReportChange={setReport}
            onFilterChange={setFilter}
            onTask={onTask}
            onProject={onProject}
            onPerson={onPerson}
            projectSelect={projectSelect}
            analyticsPreset={analyticsPreset}
            onPresetChange={setAnalyticsPreset}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            periodAnalytics={periodAnalytics}
            reportingDate={date}
          />
        </>
      )}
      {view === "people" && (
        <>
          <PeopleGrid
            people={people}
            memberSummaries={data.signals.memberSummaries}
            availability={data.availability}
            date={date}
            onPerson={onPerson}
            onAddPerson={() => setAction({ kind: "create-person" })}
            onRecordLeave={() => setAction({ kind: "leave" })}
          />
        </>
      )}
      {view === "ledger" && (
        <Stack gap="md">
          <Card withBorder p="sm" radius="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="xs" align="center">
                <Select
                  label="Subject type"
                  value={filter}
                  onChange={(v) => setFilter(v ?? "all")}
                  data={[
                    "all",
                    "project",
                    "task",
                    "blocker",
                    "availability",
                    "person",
                  ]}
                  maw={220}
                />
              </Group>

              <Badge size="md" variant="light" color="teal">
                {ledger.length} Recorded events
              </Badge>
            </Group>
          </Card>

          <LedgerList records={ledger} data={data} onRecord={setRecord} />
        </Stack>
      )}
      <LedgerRecordModal
        record={record}
        onClose={() => setRecord(null)}
        personName={personName}
      />
      <Modal
        opened={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Local Workspace"
      >
        <Stack gap="md">
          <Alert color="orange" icon={<IconAlertTriangle size={16} />}>
            This is a development and demo utility. It will wipe all local
            changes from your browser storage and restore the initial Futurelabs
            seed dataset.
          </Alert>
          <Text size="sm">
            This operation only resets local browser storage
            (VITE_DATA_BACKEND=local). Cloud Supabase data is never touched.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={resetMutation.isPending}
              onClick={async () => {
                await resetMutation.mutateAsync();
                setResetModalOpen(false);
              }}
            >
              Reset to seed data
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AdminTemplate>

  );
}
