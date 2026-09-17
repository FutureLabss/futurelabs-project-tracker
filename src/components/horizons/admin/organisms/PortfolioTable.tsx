import { Card, Table } from "@mantine/core";
import { PortfolioRow } from "../molecules/PortfolioRow";
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
  const personName = (id?: string | null) => {
    if (!id) return "Unknown";
    const person = data.people.find((p) => p.id === id);
    return person ? person.name : "Unknown";
  };

  return (
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
                  <EmptyState message="No projects match. Create a project to get started." />
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}
