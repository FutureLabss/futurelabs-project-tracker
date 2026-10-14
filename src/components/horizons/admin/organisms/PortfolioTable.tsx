import { useState } from "react";
import {
  Card,
  Group,
  SegmentedControl,
  SimpleGrid,
  Table,
  Text,
} from "@mantine/core";
import {
  IconLayoutGrid,
  IconTable,
} from "@tabler/icons-react";
import { PortfolioRow } from "../molecules/PortfolioRow";
import { PortfolioCard } from "../molecules/PortfolioCard";
import { EmptyState } from "../atoms/EmptyState";
import type { Project } from "../../../../entities/project.entity";
import type { AdminWorkspace } from "../../../../api/hooks/use-admin-workspace";

interface PortfolioTableProps {
  projects: Project[];
  data: AdminWorkspace;
  onProject: (id: string) => void;
  onPerson: (id: string) => void;
  onAssignLead: (projectId: string) => void;
}

export function PortfolioTable({
  projects,
  data,
  onProject,
  onPerson,
  onAssignLead,
}: PortfolioTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const personName = (id?: string | null) => {
    if (!id) return "Unknown";
    const person = data.people.find((p) => p.id === id);
    return person ? person.name : "Unknown";
  };

  return (
    <Card withBorder radius="md" p="md">
      {/* Table Utility Bar */}
      <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="xs">
        <Text size="sm" fw={600} c="dimmed">
          Showing {projects.length} {projects.length === 1 ? "project" : "projects"}
        </Text>

        <SegmentedControl
          size="xs"
          value={viewMode}
          onChange={(val) => setViewMode(val as "table" | "cards")}
          data={[
            {
              value: "table",
              label: (
                <Group gap={5} wrap="nowrap">
                  <IconTable size={14} />
                  <span>Table</span>
                </Group>
              ),
            },
            {
              value: "cards",
              label: (
                <Group gap={5} wrap="nowrap">
                  <IconLayoutGrid size={14} />
                  <span>Cards</span>
                </Group>
              ),
            },
          ]}
        />
      </Group>

      {/* Content: Cards or Table */}
      {viewMode === "cards" ? (
        projects.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {projects.map((p) => {
              const s = data.signals.projectSummaries.find(
                (sum) => sum.projectId === p.id,
              );
              return (
                <PortfolioCard
                  key={p.id}
                  project={p}
                  managerName={personName(p.managerId)}
                  summary={s}
                  onProject={onProject}
                  onPerson={onPerson}
                  onAssignLead={onAssignLead}
                />
              );
            })}
          </SimpleGrid>
        ) : (
          <EmptyState message="No projects match this filter. Create a project to get started." />
        )
      ) : (
        <Table.ScrollContainer minWidth={920}>
          <Table highlightOnHover className="admin-portfolio-table" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                {[
                  "Project",
                  "Lead",
                  "Progress",
                  "Health",
                  "Task Status",
                  "Target",
                  "Actions",
                ].map((h) => (
                  <Table.Th key={h} style={{ fontSize: 12, fontWeight: 700, color: "var(--mantine-color-dimmed)" }}>
                    {h}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {projects.map((p) => {
                const s = data.signals.projectSummaries.find(
                  (sum) => sum.projectId === p.id,
                );
                return (
                  <PortfolioRow
                    key={p.id}
                    project={p}
                    managerName={personName(p.managerId)}
                    summary={s}
                    onProject={onProject}
                    onPerson={onPerson}
                    onAssignLead={onAssignLead}
                  />
                );
              })}
              {!projects.length && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <EmptyState message="No projects match this filter. Create a project to get started." />
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Card>
  );
}
