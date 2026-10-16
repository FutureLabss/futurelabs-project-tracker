import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Card,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconCalendarOff,
  IconCalendarTime,
  IconChartBar,
  IconCircleCheck,
  IconCompass,
  IconFlame,
  IconFolders,
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import { PersonLink } from "../atoms/PersonLink";
import { EmptyState } from "../atoms/EmptyState";
import { BlockerCategoryCard } from "../molecules/BlockerCategoryCard";
import { TaskList } from "../AdminDetails";
import type { Task } from "../../../../entities/task.entity";
import type { AdminWorkspace } from "../../../../api/hooks/use-admin-workspace";
import type { BlockerCategoryCount } from "../../../../entities/operational-signals.entity";
import type {
  AnalyticsPreset,
  DateRange,
  calculatePeriodAnalytics,
} from "../admin-utils";

interface AnalyticsPanelProps {
  data: AdminWorkspace;
  blockerAnalytics: BlockerCategoryCount[];
  reportTasks: Task[];
  report: string;
  filter: string;
  onReportChange: (report: string) => void;
  onFilterChange: (filter: string) => void;
  onTask: (id: string) => void;
  onProject: (id: string) => void;
  onPerson: (id: string) => void;
  projectSelect: React.ReactNode;
  analyticsPreset: AnalyticsPreset;
  onPresetChange: (preset: AnalyticsPreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
  periodAnalytics: ReturnType<typeof calculatePeriodAnalytics> & {
    currentRange: DateRange;
  };
  reportingDate: string;
}

export function AnalyticsPanel({
  data,
  blockerAnalytics,
  reportTasks,
  report,
  filter,
  onReportChange,
  onFilterChange,
  onTask,
  onProject,
  onPerson,
  projectSelect,
  analyticsPreset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
  periodAnalytics,
  reportingDate,
}: AnalyticsPanelProps) {
  const periodLabel =
    analyticsPreset === "7d"
      ? "7 days"
      : analyticsPreset === "90d"
        ? "90 days"
        : analyticsPreset === "180d"
          ? "180 days"
          : analyticsPreset === "custom"
            ? `${periodAnalytics.currentRange.startDate} to ${periodAnalytics.currentRange.endDate}`
            : "30 days";

  const totalDeliveredPoints =
    periodAnalytics.current.unplannedAcceptedWeight +
    periodAnalytics.current.plannedAcceptedWeight;

  return (
    <Stack gap="md">
      {/* Time Window Toolbar */}
      <Paper withBorder radius="md" p="sm">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="xs" wrap="wrap" align="center">
            <Group gap={6} wrap="nowrap">
              <IconCalendarTime
                size={18}
                style={{ color: "var(--mantine-color-teal-filled)" }}
              />
              <Text size="sm" fw={600}>
                Time Window
              </Text>
            </Group>

            <SegmentedControl
              value={analyticsPreset}
              onChange={(v) => onPresetChange(v as AnalyticsPreset)}
              data={[
                { label: "7 days", value: "7d" },
                { label: "30 days", value: "30d" },
                { label: "90 days", value: "90d" },
                { label: "180 days", value: "180d" },
                { label: "Custom", value: "custom" },
              ]}
              size="xs"
            />

            {analyticsPreset === "custom" && (
              <Group gap="xs" align="center">
                <TextInput
                  type="date"
                  size="xs"
                  max={reportingDate}
                  value={customRange.startDate}
                  onChange={(e) =>
                    onCustomRangeChange({
                      ...customRange,
                      startDate: e.currentTarget.value,
                    })
                  }
                  placeholder="Start date"
                />
                <Text size="xs" c="dimmed">
                  to
                </Text>
                <TextInput
                  type="date"
                  size="xs"
                  max={reportingDate}
                  value={customRange.endDate}
                  onChange={(e) =>
                    onCustomRangeChange({
                      ...customRange,
                      endDate: e.currentTarget.value,
                    })
                  }
                  placeholder="End date"
                />
              </Group>
            )}
          </Group>

          <Tooltip
            label={`Active: ${periodAnalytics.currentRange.startDate} → ${periodAnalytics.currentRange.endDate} · Baseline: ${periodAnalytics.previousRange.startDate} → ${periodAnalytics.previousRange.endDate}`}
            withArrow
          >
            <Badge size="sm" variant="light" color="gray">
              {periodAnalytics.currentRange.startDate} → {periodAnalytics.currentRange.endDate} (vs. prev {periodLabel})
            </Badge>
          </Tooltip>
        </Group>
      </Paper>

      {/* KPI Metric Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md">
        {/* Accepted Throughput */}
        <Card withBorder radius="md" p="md">
          <Stack gap="xs">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Accepted ({periodLabel})
                </Text>
                <Text fz={28} fw={800} style={{ lineHeight: 1 }}>
                  {periodAnalytics.current.acceptedCount}
                </Text>
              </Stack>
              <ThemeIcon size="md" radius="md" variant="light" color="teal">
                <IconCircleCheck size={18} />
              </ThemeIcon>
            </Group>

            <Text size="xs" c="dimmed">
              {periodAnalytics.current.acceptedWeight} complexity pts delivered
            </Text>

            <Group gap={4} wrap="nowrap">
              <Badge
                size="xs"
                color={periodAnalytics.trends.acceptedDelta >= 0 ? "teal" : "orange"}
                variant="light"
                leftSection={
                  periodAnalytics.trends.acceptedDelta >= 0 ? (
                    <IconTrendingUp size={11} />
                  ) : (
                    <IconTrendingDown size={11} />
                  )
                }
              >
                {periodAnalytics.trends.acceptedDelta >= 0 ? "+" : ""}
                {periodAnalytics.trends.acceptedDelta} vs prev ({periodAnalytics.previous.acceptedCount})
              </Badge>
            </Group>
          </Stack>
        </Card>

        {/* Rework Rate */}
        <Card withBorder radius="md" p="md">
          <Stack gap="xs">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Rework Rate
                </Text>
                <Text
                  fz={28}
                  fw={800}
                  style={{ lineHeight: 1 }}
                  c={
                    periodAnalytics.current.reworkRatePercent > 20
                      ? "red.7"
                      : undefined
                  }
                >
                  {periodAnalytics.current.reworkRatePercent.toFixed(1)}%
                </Text>
              </Stack>
              <ThemeIcon
                size="md"
                radius="md"
                variant="light"
                color={
                  periodAnalytics.current.reworkRatePercent > 20
                    ? "red"
                    : "orange"
                }
              >
                <IconArrowBackUp size={18} />
              </ThemeIcon>
            </Group>

            <Text size="xs" c="dimmed">
              {periodAnalytics.current.totalReturns} returns / {periodAnalytics.current.totalSubmissions} submissions
            </Text>

            <Group gap={4} wrap="nowrap">
              <Badge
                size="xs"
                color={periodAnalytics.trends.reworkRateDelta <= 0 ? "teal" : "red"}
                variant="light"
                leftSection={
                  periodAnalytics.trends.reworkRateDelta <= 0 ? (
                    <IconTrendingDown size={11} />
                  ) : (
                    <IconTrendingUp size={11} />
                  )
                }
              >
                {periodAnalytics.trends.reworkRateDelta <= 0 ? "" : "+"}
                {periodAnalytics.trends.reworkRateDelta.toFixed(1)}% vs prev ({periodAnalytics.previous.reworkRatePercent.toFixed(1)}%)
              </Badge>
            </Group>
          </Stack>
        </Card>

        {/* Unplanned Capacity */}
        <Card withBorder radius="md" p="md">
          <Stack gap="xs">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Unplanned Capacity
                </Text>
                <Text fz={28} fw={800} style={{ lineHeight: 1 }}>
                  {periodAnalytics.current.unplannedCapacityPercent.toFixed(1)}%
                </Text>
              </Stack>
              <ThemeIcon size="md" radius="md" variant="light" color="orange">
                <IconFlame size={18} />
              </ThemeIcon>
            </Group>

            <Text size="xs" c="dimmed">
              {periodAnalytics.current.unplannedAcceptedWeight} unplanned of {totalDeliveredPoints} delivered pts
            </Text>

            <Group gap={4} wrap="nowrap">
              <Badge
                size="xs"
                color={periodAnalytics.trends.unplannedCapacityDelta <= 0 ? "teal" : "orange"}
                variant="light"
              >
                {periodAnalytics.trends.unplannedCapacityDelta <= 0 ? "" : "+"}
                {periodAnalytics.trends.unplannedCapacityDelta.toFixed(1)}% vs prev ({periodAnalytics.previous.unplannedCapacityPercent.toFixed(1)}%)
              </Badge>
            </Group>
          </Stack>
        </Card>

        {/* Date Changes & Slips */}
        <Card withBorder radius="md" p="md">
          <Stack gap="xs">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Schedule Slips
                </Text>
                <Text
                  fz={28}
                  fw={800}
                  style={{ lineHeight: 1 }}
                  c={periodAnalytics.current.dateChanges > 0 ? "red.7" : undefined}
                >
                  {periodAnalytics.current.dateChanges}
                </Text>
              </Stack>
              <ThemeIcon
                size="md"
                radius="md"
                variant="light"
                color={periodAnalytics.current.dateChanges > 0 ? "red" : "gray"}
              >
                <IconCalendarOff size={18} />
              </ThemeIcon>
            </Group>

            <Text size="xs" c="dimmed">
              Rescheduled tasks in period
            </Text>

            <Group gap={4} wrap="nowrap">
              <Badge
                size="xs"
                color={periodAnalytics.trends.dateChangesDelta <= 0 ? "teal" : "red"}
                variant="light"
              >
                {periodAnalytics.trends.dateChangesDelta <= 0 ? "" : "+"}
                {periodAnalytics.trends.dateChangesDelta} vs prev ({periodAnalytics.previous.dateChanges})
              </Badge>
            </Group>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Report Navigation Tabs */}
      <Tabs
        value={report}
        onChange={(v) => {
          onReportChange(v ?? "throughput");
          onFilterChange("all");
        }}
        variant="outline"
        radius="md"
      >
        <Tabs.List style={{ flexWrap: "wrap", gap: 4 }}>
          <Tabs.Tab
            value="throughput"
            leftSection={<IconCircleCheck size={15} />}
          >
            Accepted ({periodLabel})
          </Tabs.Tab>
          <Tabs.Tab
            value="rework"
            leftSection={<IconArrowBackUp size={15} />}
          >
            Returned Work
          </Tabs.Tab>
          <Tabs.Tab
            value="unplanned"
            leftSection={<IconCompass size={15} />}
          >
            Unplanned Open Work
          </Tabs.Tab>
          <Tabs.Tab
            value="slips"
            leftSection={<IconCalendarOff size={15} />}
          >
            Deadline Slips
          </Tabs.Tab>
          <Tabs.Tab
            value="blockers"
            leftSection={<IconAlertTriangle size={15} />}
          >
            Blocker Causes
          </Tabs.Tab>
          <Tabs.Tab
            value="breakdown"
            leftSection={<IconChartBar size={15} />}
          >
            Project & Team Breakdown
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* Report Sub-Views */}
      {report === "blockers" && (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
          {blockerAnalytics.map((b) => (
            <BlockerCategoryCard
              key={b.category}
              category={b.category}
              label={b.label}
              activeCount={b.activeCount}
              avgResolutionDays={b.avgResolutionDays}
              isSelected={filter === b.category}
              onToggle={(cat) =>
                onFilterChange(filter === cat ? "all" : cat)
              }
            />
          ))}
        </SimpleGrid>
      )}

      {report === "breakdown" ? (
        <Stack gap="lg">
          {/* Project Delivery in Period */}
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" align="center" mb="md">
              <Group gap="xs">
                <IconFolders size={20} color="var(--mantine-color-teal-filled)" />
                <Title order={4} size="h5">
                  Project Delivery in Period
                </Title>
              </Group>
              <Badge variant="light" color="teal">
                {periodAnalytics.projectBreakdown.length} active projects
              </Badge>
            </Group>

            <Table.ScrollContainer minWidth={700}>
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    {[
                      "Project",
                      "Lead",
                      "Accepted",
                      "Points Delivered",
                      "Rework Returns",
                      "Date Slips",
                      "Open Tasks",
                    ].map((h) => (
                      <Table.Th
                        key={h}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--mantine-color-dimmed)",
                        }}
                      >
                        {h}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {periodAnalytics.projectBreakdown.map((p) => (
                    <Table.Tr key={p.projectId}>
                      <Table.Td>
                        <Anchor
                          component="button"
                          ta="left"
                          fw={600}
                          onClick={() => onProject(p.projectId)}
                        >
                          {p.projectName}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        {p.managerId && p.managerName ? (
                          <Group gap={6} wrap="nowrap">
                            <Avatar size="xs" radius="xl" color="teal">
                              {p.managerName.slice(0, 2).toUpperCase()}
                            </Avatar>
                            <PersonLink
                              name={p.managerName}
                              onClick={() => onPerson(p.managerId!)}
                            />
                          </Group>
                        ) : (
                          <Badge size="xs" variant="light" color="red">
                            Unmanaged
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="teal">
                          {p.acceptedCount}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {p.acceptedWeight} pts
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={p.returnsCount > 0 ? "red" : "gray"}
                        >
                          {p.returnsCount}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={p.dateChangesCount > 0 ? "orange" : "gray"}
                        >
                          {p.dateChangesCount}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="outline" color="gray">
                          {p.openTasksCount} open
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!periodAnalytics.projectBreakdown.length && (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        <EmptyState message="No projects recorded in this window." />
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>

          {/* Team Member Delivery in Period */}
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" align="center" mb="md">
              <Group gap="xs">
                <IconUsers size={20} color="var(--mantine-color-blue-filled)" />
                <Title order={4} size="h5">
                  Team Member Delivery in Period
                </Title>
              </Group>
              <Badge variant="light" color="blue">
                {periodAnalytics.personBreakdown.length} contributors
              </Badge>
            </Group>

            <Table.ScrollContainer minWidth={700}>
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    {[
                      "Team Member",
                      "Role",
                      "Status",
                      "Accepted",
                      "Points Delivered",
                      "Returns",
                      "Active Tasks",
                    ].map((h) => (
                      <Table.Th
                        key={h}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--mantine-color-dimmed)",
                        }}
                      >
                        {h}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {periodAnalytics.personBreakdown.map((person) => (
                    <Table.Tr key={person.personId}>
                      <Table.Td>
                        <Group gap={6} wrap="nowrap">
                          <Avatar size="xs" radius="xl" color="blue">
                            {person.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Anchor
                            component="button"
                            ta="left"
                            fw={600}
                            onClick={() => onPerson(person.personId)}
                          >
                            {person.name}
                          </Anchor>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="outline" color="gray">
                          {person.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          variant="light"
                          color={person.status === "inactive" ? "gray" : "teal"}
                        >
                          {person.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="teal">
                          {person.acceptedCount}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {person.acceptedWeight} pts
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={person.returnsCount > 0 ? "red" : "gray"}
                        >
                          {person.returnsCount}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="outline" color="gray">
                          {person.activeTasksCount} active
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!periodAnalytics.personBreakdown.length && (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        <EmptyState message="No team member activity recorded in this window." />
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
        </Stack>
      ) : (
        <>
          <Group justify="space-between" align="flex-end">
            <Box style={{ flex: 1, maxWidth: 360 }}>
              {projectSelect}
            </Box>
            <Badge size="sm" variant="light" color="gray">
              {reportTasks.length} {reportTasks.length === 1 ? "task" : "tasks"}
            </Badge>
          </Group>

          <Card withBorder radius="md">
            <TaskList tasks={reportTasks} data={data} onTask={onTask} />
          </Card>
        </>
      )}
    </Stack>
  );
}
