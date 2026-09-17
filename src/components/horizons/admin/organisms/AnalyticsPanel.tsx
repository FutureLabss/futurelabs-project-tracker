import { Card, SimpleGrid, Tabs, Text } from "@mantine/core";
import { MetricCard } from "../atoms/MetricCard";
import { BlockerCategoryCard } from "../molecules/BlockerCategoryCard";
import { TaskList } from "../AdminDetails";
import type { Task } from "../../../../entities/task.entity";
import type { AdminWorkspace } from "../../../../api/hooks/use-admin-workspace";
import type { OrgMetricSummary, BlockerCategoryCount } from "../../../../entities/operational-signals.entity";

interface AnalyticsPanelProps {
  data: AdminWorkspace;
  metrics: OrgMetricSummary;
  blockerAnalytics: BlockerCategoryCount[];
  reportTasks: Task[];
  report: string;
  filter: string;
  dateChangeCount: number;
  onReportChange: (report: string) => void;
  onFilterChange: (filter: string) => void;
  onTask: (id: string) => void;
  projectSelect: React.ReactNode;
}

export function AnalyticsPanel({
  data,
  metrics,
  blockerAnalytics,
  reportTasks,
  report,
  filter,
  dateChangeCount,
  onReportChange,
  onFilterChange,
  onTask,
  projectSelect,
}: AnalyticsPanelProps) {
  return (
    <>
      <Text size="sm" c="dimmed">
        Organization totals below use all accessible records. Filters apply
        to the detail table and CSV export.
      </Text>
      <SimpleGrid cols={{ base: 1, xs: 2, xl: 4 }}>
        <MetricCard
          label="Accepted in 6 months"
          value={metrics.acceptedThroughput6m}
          detail={`${metrics.acceptedWeight6m} complexity points`}
        />
        <MetricCard
          label="Rework rate"
          value={`${metrics.reworkRatePercent.toFixed(1)}%`}
          detail={`${metrics.totalReturns} returns / ${metrics.totalSubmissions} submissions`}
        />
        <MetricCard
          label="Unplanned capacity"
          value={`${metrics.unplannedCapacityPercent.toFixed(1)}%`}
          detail={`${metrics.unplannedWeight} unplanned / ${metrics.plannedWeight} planned points`}
        />
        <MetricCard
          label="Date changes"
          value={dateChangeCount}
          detail="Recorded rescheduling events"
        />
      </SimpleGrid>
      <Tabs
        value={report}
        onChange={(v) => {
          onReportChange(v ?? "throughput");
          onFilterChange("all");
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
      {projectSelect}
      <Card withBorder>
        <TaskList tasks={reportTasks} data={data} onTask={onTask} />
      </Card>
    </>
  );
}
