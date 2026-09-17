import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useAdminWorkspace } from "../../../api/hooks/use-admin-workspace";
import type { AdminView } from "../../../types/dashboard";
import type { LedgerRecord } from "../../../entities/ledger-record.entity";
import { AdminActionDialog, type AdminAction } from "./AdminActionDialog";
import { AdminDetails, LedgerList, TaskList } from "./AdminDetails";
import { downloadCsv, isOpen, readable } from "./admin-utils";
import { MetricCard } from "./atoms/MetricCard";
import { EmptyState } from "./atoms/EmptyState";
import { RiskSignalCard } from "./molecules/RiskSignalCard";
import { LedgerRecordModal } from "./molecules/LedgerRecordModal";
import { PortfolioTable } from "./organisms/PortfolioTable";
import { GovernancePanel } from "./organisms/GovernancePanel";
import { PeopleGrid } from "./organisms/PeopleGrid";
import { AnalyticsPanel } from "./organisms/AnalyticsPanel";
import { AdminTemplate } from "./templates/AdminTemplate";

const headings: Record<AdminView, [string, string]> = {
  portfolio: [
    "Portfolio operations",
    "Project health, delivery ownership, and outcomes across your organization.",
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
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Partial<Record<AdminView, string>>>(
    {},
  );
  const filter = filters[view] ?? "all";
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
  const metrics = data.signals.orgMetrics;
  const projects = data.projects.filter(
    (p) =>
      matches(p.name, p.goal, personName(p.managerId)) &&
      (filter === "all" ||
        filter === p.state ||
        (filter === "unmanaged" && !p.managerId && p.state === "active") ||
        filter ===
          data.signals.projectSummaries.find((s) => s.projectId === p.id)
            ?.ragStatus),
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
  const risks = data.signals.attentionItems.filter(
    (r) =>
      matches(r.headline, r.details, r.projectName, r.assigneeName) &&
      (filter === "all" || filter === r.signalType) &&
      (!projectFilter || r.projectId === projectFilter),
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
  const monthAgo = new Date(`${date}T00:00:00`);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const reportTaskIds = new Set(
    data.ledger
      .filter((r) =>
        report === "rework"
          ? r.type === "task_returned"
          : r.type === "task_redated",
      )
      .map((r) => r.subjectId),
  );
  const reportTasks = data.tasks.filter(
    (t) =>
      matches(t.title, projectName(t.projectId), personName(t.assigneeId)) &&
      (!projectFilter || t.projectId === projectFilter) &&
      (report === "throughput"
        ? t.status === "accepted" &&
          !!t.acceptedAt &&
          new Date(t.acceptedAt) >= monthAgo &&
          t.acceptedAt.slice(0, 10) <= date
        : report === "unplanned"
          ? t.origin === "unplanned" && isOpen(t)
          : report === "blockers"
            ? data.blockers.some(
                (b) =>
                  b.taskId === t.id &&
                  !b.clearedAt &&
                  (filter === "all" || b.category === filter),
              )
            : reportTaskIds.has(t.id)),
  );
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
        ["Name", "Email", "Role", "Status", "Open tasks", "Complexity points"],
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
      ...(view === "analytics" ? reportTasks : tasks).map((t) => [
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
      onNewProject={() => setAction({ kind: "project" })}
      queryError={query.isError ? query.error.message : undefined}
      exportError={exportError}
      exportNotice={exportNotice}
      onClearExportNotice={() => setExportNotice("")}
      metricsGrid={
        <SimpleGrid cols={{ base: 1, xs: 2, xl: 4 }}>
          <MetricCard
            label="Active projects"
            value={activeProjects.length}
            detail={`${activeProjects.filter((p) => !p.managerId).length} without a lead`}
            onClick={() => changeView("portfolio")}
          />
          <MetricCard
            label="Accepted in 30 days"
            value={metrics.acceptedThroughput30d}
            detail={`${metrics.acceptedWeight30d} complexity points`}
            onClick={() => {
              changeView("analytics");
              setReport("throughput");
            }}
          />
          <MetricCard
            label="Review queue"
            value={data.tasks.filter((t) => t.status === "submitted").length}
            detail="Submitted deliverables awaiting acceptance"
            onClick={() => {
              changeView("tasks", "submitted");
            }}
          />
          <MetricCard
            label="Critical risks"
            value={data.signals.attentionItems.filter((r) => r.severity === "critical")
              .length}
            detail="Signals requiring investigation"
            onClick={() => changeView("risks")}
          />
        </SimpleGrid>
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
          />
        )
      }
    >
      {view === "portfolio" && (
        <>
          <Select
            label="Portfolio filter"
            value={filter}
            onChange={(v) => setFilter(v ?? "all")}
            maw={280}
            data={[
              { value: "all", label: "All projects" },
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" },
              { value: "unmanaged", label: "Unmanaged" },
              { value: "red", label: "Red" },
              { value: "amber", label: "Amber" },
              { value: "green", label: "Green" },
            ]}
          />
          <PortfolioTable
            projects={projects}
            data={data}
            onProject={onProject}
            onPerson={onPerson}
            onAssignLead={(projectId) => setAction({ kind: "lead", projectId })}
          />
        </>
      )}
      {view === "tasks" && (
        <>
          <Group align="flex-end" justify="space-between">
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
          <Card withBorder>
            <TaskList tasks={tasks} data={data} onTask={onTask} />
          </Card>
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
        <>
          <Group align="flex-end">
            {projectSelect}
            <Select
              label="Signal"
              value={filter}
              onChange={(v) => setFilter(v ?? "all")}
              data={[
                "all",
                "silent_overrun",
                "aging_wip",
                "aging_blocker",
                "stale_inactivity",
                "overdue",
                "imminent_unstarted",
                "unowned_task",
                "unmanaged_project",
              ].map((value) => ({ value, label: readable(value) }))}
            />
          </Group>
          {!risks.length && (
            <Card withBorder>
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
        </>
      )}
      {view === "analytics" && (
        <>
          <AnalyticsPanel
            data={data}
            metrics={metrics}
            blockerAnalytics={data.signals.blockerAnalytics}
            reportTasks={reportTasks}
            report={report}
            filter={filter}
            dateChangeCount={data.ledger.filter((r) => r.type === "task_redated").length}
            onReportChange={setReport}
            onFilterChange={setFilter}
            onTask={onTask}
            projectSelect={projectSelect}
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
            onRecordLeave={() => setAction({ kind: "leave" })}
          />
        </>
      )}
      {view === "ledger" && (
        <>
          <Select
            label="Subject type"
            value={filter}
            onChange={(v) => setFilter(v ?? "all")}
            data={["all", "project", "task", "blocker", "availability"]}
            maw={280}
          />
          <LedgerList records={ledger} data={data} onRecord={setRecord} />
        </>
      )}
      {selection && (
        <AdminDetails
          selection={selection}
          data={data}
          onClose={() => setSelection(null)}
          onProject={onProject}
          onTask={onTask}
          onPerson={onPerson}
          onAction={setAction}
          onRecord={setRecord}
        />
      )}
      {action && (
        <AdminActionDialog
          action={action}
          data={data}
          actorId={actorId}
          date={date}
          onClose={() => setAction(null)}
        />
      )}
      <LedgerRecordModal
        record={record}
        onClose={() => setRecord(null)}
        personName={personName}
      />
    </AdminTemplate>
  );
}
