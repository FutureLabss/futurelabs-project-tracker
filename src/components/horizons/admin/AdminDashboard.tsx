import { useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconDownload, IconPlus, IconRefresh } from "@tabler/icons-react";
import { useAdminWorkspace } from "../../../api/hooks/use-admin-workspace";
import type { AdminView } from "../../../types/dashboard";
import type { LedgerRecord } from "../../../entities/ledger-record.entity";
import { AdminActionDialog, type AdminAction } from "./AdminActionDialog";
import { AdminDetails, LedgerList, TaskList } from "./AdminDetails";
import { downloadCsv, isOpen, readable } from "./admin-utils";

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
  const metric = (
    label: string,
    value: string | number,
    detail: string,
    onClick?: () => void,
  ) => (
    <Card withBorder radius="md" key={label}>
      <Stack gap={6}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {label}
        </Text>
        {onClick ? (
          <Anchor
            component="button"
            ta="left"
            fz={30}
            fw={750}
            onClick={onClick}
          >
            {value}
          </Anchor>
        ) : (
          <Text fz={30} fw={750}>
            {value}
          </Text>
        )}
        <Text size="sm" c="dimmed">
          {detail}
        </Text>
      </Stack>
    </Card>
  );
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
    <Stack gap="lg" p={{ base: "md", md: "xl" }}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Badge color="teal" variant="light">
            Administrator
          </Badge>
          <Title mt="xs" order={1} size="h2">
            {headings[view][0]}
          </Title>
          <Text c="dimmed" mt={4}>
            {headings[view][1]}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Reporting date: {date} · Writes are recorded at the current time.
          </Text>
        </div>
        <Group gap="xs">
          <Button
            variant="default"
            leftSection={<IconRefresh size={16} />}
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={exportReport}
          >
            Export CSV
          </Button>
          <Button
            color="teal"
            leftSection={<IconPlus size={16} />}
            onClick={() => setAction({ kind: "project" })}
          >
            New project
          </Button>
        </Group>
      </Group>
      {query.isError && (
        <Alert color="red" title="Refresh failed">
          {query.error.message} — showing the last loaded records.
        </Alert>
      )}
      {exportError && <Alert color="red">{exportError}</Alert>}
      {exportNotice && (
        <Alert
          color="teal"
          withCloseButton
          onClose={() => setExportNotice("")}
          role="status"
        >
          {exportNotice}
        </Alert>
      )}
      <SimpleGrid cols={{ base: 1, xs: 2, xl: 4 }}>
        {metric(
          "Active projects",
          activeProjects.length,
          `${activeProjects.filter((p) => !p.managerId).length} without a lead`,
          () => changeView("portfolio"),
        )}
        {metric(
          "Accepted in 30 days",
          metrics.acceptedThroughput30d,
          `${metrics.acceptedWeight30d} complexity points`,
          () => {
            changeView("analytics");
            setReport("throughput");
          },
        )}
        {metric(
          "Review queue",
          data.tasks.filter((t) => t.status === "submitted").length,
          "Submitted deliverables awaiting acceptance",
          () => {
            changeView("tasks", "submitted");
          },
        )}
        {metric(
          "Critical risks",
          data.signals.attentionItems.filter((r) => r.severity === "critical")
            .length,
          "Signals requiring investigation",
          () => changeView("risks"),
        )}
      </SimpleGrid>
      <TextInput
        label="Search current view"
        placeholder="Search projects, tasks, people, or changes"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
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
          <Card withBorder>
            <Table.ScrollContainer minWidth={1000}>
              <Table highlightOnHover className="admin-portfolio-table">
                <Table.Thead>
                  <Table.Tr>
                    {[
                      "Project",
                      "Lead",
                      "Target",
                      "Health",
                      "Open / Overdue / Blocked",
                      "Slips",
                      "Actions",
                    ].map((h) => (
                      <Table.Th key={h}>{h}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {projects.map((p) => {
                    const s = data.signals.projectSummaries.find(
                      (s) => s.projectId === p.id,
                    );
                    return (
                      <Table.Tr key={p.id}>
                        <Table.Td>
                          <Anchor
                            component="button"
                            ta="left"
                            onClick={() => onProject(p.id)}
                          >
                            {p.name}
                          </Anchor>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {p.goal}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {p.managerId ? (
                            <Anchor
                              component="button"
                              onClick={() => onPerson(p.managerId!)}
                            >
                              {personName(p.managerId)}
                            </Anchor>
                          ) : (
                            <Badge color="red">Unmanaged</Badge>
                          )}
                        </Table.Td>
                        <Table.Td>{p.targetDate}</Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              p.state === "closed"
                                ? "gray"
                                : s?.ragStatus === "red"
                                  ? "red"
                                  : s?.ragStatus === "amber"
                                    ? "orange"
                                    : "teal"
                            }
                          >
                            {p.state === "closed"
                              ? "Closed"
                              : (s?.ragStatus ?? "Unknown")}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {s?.openTasksCount ?? 0} / {s?.overdueTasksCount ?? 0}{" "}
                          / {s?.blockedTasksCount ?? 0}
                        </Table.Td>
                        <Table.Td>{s?.slipCount ?? 0}</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => onProject(p.id)}
                            >
                              Inspect
                            </Button>
                            {p.state === "active" && (
                              <Button
                                size="xs"
                                variant="subtle"
                                onClick={() =>
                                  setAction({ kind: "lead", projectId: p.id })
                                }
                              >
                                Assign lead
                              </Button>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {!projects.length && (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        <Text ta="center" c="dimmed">
                          No projects match. Create a project to get started.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
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
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Card withBorder>
              <Title order={2} size="h4">
                Projects without a lead
              </Title>
              <Stack mt="md">
                {activeProjects
                  .filter((p) => !p.managerId && matches(p.name))
                  .map((p) => (
                    <Group key={p.id} justify="space-between">
                      <Anchor
                        component="button"
                        ta="left"
                        onClick={() => onProject(p.id)}
                      >
                        {p.name}
                      </Anchor>
                      <Button
                        size="xs"
                        onClick={() =>
                          setAction({ kind: "lead", projectId: p.id })
                        }
                      >
                        Assign lead
                      </Button>
                    </Group>
                  ))}
                {!activeProjects.some(
                  (p) => !p.managerId && matches(p.name),
                ) && (
                  <Text c="dimmed">No unmanaged projects match this view.</Text>
                )}
              </Stack>
            </Card>
            <Card withBorder>
              <Title order={2} size="h4">
                Lead coverage
              </Title>
              <Text mt="sm">
                {activeProjects.filter((p) => p.managerId).length} of{" "}
                {activeProjects.length} active projects have a designated lead.
              </Text>
              <Progress
                mt="md"
                value={
                  activeProjects.length
                    ? (activeProjects.filter((p) => p.managerId).length /
                        activeProjects.length) *
                      100
                    : 0
                }
                color="teal"
              />
              <Button
                mt="md"
                variant="light"
                onClick={() => changeView("portfolio")}
              >
                Manage projects and access
              </Button>
            </Card>
          </SimpleGrid>
          <Card withBorder>
            <Title order={2} size="h4" mb="md">
              Unassigned open work
            </Title>
            <TaskList
              tasks={data.tasks.filter(
                (t) =>
                  !t.assigneeId &&
                  isOpen(t) &&
                  matches(t.title, projectName(t.projectId)),
              )}
              data={data}
              onTask={onTask}
            />
          </Card>
          <Card withBorder>
            <Title order={2} size="h4" mb="md">
              Deliverables awaiting review
            </Title>
            <TaskList
              tasks={data.tasks.filter(
                (t) =>
                  t.status === "submitted" &&
                  matches(t.title, projectName(t.projectId)),
              )}
              data={data}
              onTask={onTask}
            />
          </Card>
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
              <Text c="dimmed">No matching risks for this reporting date.</Text>
            </Card>
          )}
          {risks.map((r) => (
            <Card key={r.id} withBorder>
              <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                  <Group>
                    <Badge
                      color={
                        r.severity === "critical"
                          ? "red"
                          : r.severity === "warning"
                            ? "orange"
                            : "blue"
                      }
                    >
                      {r.severity}
                    </Badge>
                    <Text fw={600}>{r.headline}</Text>
                  </Group>
                  <Text size="sm">{r.details}</Text>
                  <Text size="xs" c="dimmed">
                    {r.projectName} · {r.assigneeName}
                  </Text>
                </Stack>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => {
                    if (r.taskId) onTask(r.taskId);
                    else if (r.projectId) onProject(r.projectId);
                  }}
                >
                  Investigate
                </Button>
              </Group>
            </Card>
          ))}
        </>
      )}
      {view === "analytics" && (
        <>
          <Text size="sm" c="dimmed">
            Organization totals below use all accessible records. Filters apply
            to the detail table and CSV export.
          </Text>
          <SimpleGrid cols={{ base: 1, xs: 2, xl: 4 }}>
            {metric(
              "Accepted in 6 months",
              metrics.acceptedThroughput6m,
              `${metrics.acceptedWeight6m} complexity points`,
            )}
            {metric(
              "Rework rate",
              `${metrics.reworkRatePercent.toFixed(1)}%`,
              `${metrics.totalReturns} returns / ${metrics.totalSubmissions} submissions`,
            )}
            {metric(
              "Unplanned capacity",
              `${metrics.unplannedCapacityPercent.toFixed(1)}%`,
              `${metrics.unplannedWeight} unplanned / ${metrics.plannedWeight} planned points`,
            )}
            {metric(
              "Date changes",
              data.ledger.filter((r) => r.type === "task_redated").length,
              "Recorded rescheduling events",
            )}
          </SimpleGrid>
          <Tabs
            value={report}
            onChange={(v) => {
              setReport(v ?? "throughput");
              setFilter("all");
            }}
          >
            <Tabs.List>
              {[
                ["throughput", "Accepted (30 days)"],
                ["rework", "Returned work"],
                ["unplanned", "Unplanned open work"],
                ["slips", "Deadline slips"],
                ["blockers", "Blocker causes"],
              ].map(([value, label]) => (
                <Tabs.Tab key={value} value={value}>
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
          {report === "blockers" && (
            <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }}>
              {data.signals.blockerAnalytics.map((b) => (
                <Card key={b.category} withBorder>
                  <Text fw={600}>{b.label}</Text>
                  <Text size="sm">
                    {b.activeCount} active · Average resolution{" "}
                    {b.avgResolutionDays.toFixed(1)} working days
                  </Text>
                  <Button
                    mt="sm"
                    variant={filter === b.category ? "filled" : "light"}
                    onClick={() =>
                      setFilter(filter === b.category ? "all" : b.category)
                    }
                  >
                    Inspect category
                  </Button>
                </Card>
              ))}
            </SimpleGrid>
          )}
          {projectSelect}
          <Card withBorder>
            <TaskList tasks={reportTasks} data={data} onTask={onTask} />
          </Card>
        </>
      )}
      {view === "people" && (
        <>
          <Group justify="space-between">
            <Text>{people.length} people</Text>
            <Button onClick={() => setAction({ kind: "leave" })}>
              Record leave
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }}>
            {people.map((p) => {
              const s = data.signals.memberSummaries[p.id];
              const leave = data.availability.filter(
                (a) =>
                  a.personId === p.id && a.fromDate <= date && a.toDate >= date,
              );
              return (
                <Card key={p.id} withBorder>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Anchor
                        component="button"
                        fw={700}
                        onClick={() => onPerson(p.id)}
                      >
                        {p.name}
                      </Anchor>
                      <Badge>{p.role}</Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {p.title || p.email}
                    </Text>
                    <Text size="sm">
                      {s?.activeTasksCount ?? 0} open tasks ·{" "}
                      {s?.totalComplexityWeight ?? 0} points ·{" "}
                      {s?.overdueCount ?? 0} overdue
                    </Text>
                    <Badge
                      color={
                        p.status === "inactive"
                          ? "gray"
                          : leave.length
                            ? "orange"
                            : "teal"
                      }
                    >
                      {p.status === "inactive"
                        ? "Inactive"
                        : leave.length
                          ? "On leave"
                          : "Available"}
                    </Badge>
                    <Button
                      variant="light"
                      size="xs"
                      onClick={() => onPerson(p.id)}
                    >
                      View profile and history
                    </Button>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
          {!people.length && (
            <Text c="dimmed">No people match your search.</Text>
          )}
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
      <Modal
        opened={!!record}
        onClose={() => setRecord(null)}
        title="Recorded change"
        centered
      >
        {record && (
          <Stack>
            <Badge>{readable(record.type)}</Badge>
            <Text>Actor: {personName(record.actorId)}</Text>
            <Text size="sm">
              {new Date(record.occurredAt).toLocaleString()}
            </Text>
            <Text size="sm">
              Subject: {record.subjectType} · {record.subjectId}
            </Text>
            <Text>From: {record.fromValue ?? "—"}</Text>
            <Text>To: {record.toValue ?? "—"}</Text>
            <Text>Reason: {record.reason || "No reason recorded."}</Text>
            <Text size="xs" c="dimmed">
              This is an immutable audit entry.
            </Text>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
