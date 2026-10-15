import { useState } from "react";
import { ActionIcon, Alert, Button, Group, Modal, Select, Stack, Text, Tooltip } from "@mantine/core";
import { IconUserMinus, IconUserPlus } from "@tabler/icons-react";
import type { Person } from "../../../../entities/person.entity";
import type { Project } from "../../../../entities/project.entity";
import type { ProjectMember } from "../../../../entities/project-member.entity";
import { useSetManagedProjectMember } from "../../../../api/hooks/use-manager-actions";

interface ProjectTeamModalProps {
  project: Project | null;
  people: Person[];
  members: ProjectMember[];
  actorId: string;
  onClose: () => void;
}

/** FR-22: a manager decides who can be given work in their project. */
export function ProjectTeamModal({ project, people, members, actorId, onClose }: ProjectTeamModalProps) {
  const [personId, setPersonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setMember = useSetManagedProjectMember();

  const teamIds = new Set(members.filter((m) => m.projectId === project?.id).map((m) => m.personId));
  const team = people.filter((p) => teamIds.has(p.id)).sort((a, b) => a.name.localeCompare(b.name));
  const candidates = people
    .filter(
      (p) =>
        !teamIds.has(p.id) &&
        p.id !== actorId &&
        p.status !== "inactive" &&
        (p.role === "member" || p.role === "manager"),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const change = async (id: string, included: boolean) => {
    if (!project) return;
    setError(null);
    try {
      await setMember.mutateAsync({ projectId: project.id, personId: id, included, actorId });
      if (included) setPersonId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The team could not be updated.");
    }
  };

  return (
    <Modal
      opened={project !== null}
      onClose={() => {
        setError(null);
        setPersonId(null);
        onClose();
      }}
      title={`Team: ${project?.name ?? ""}`}
      centered
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          People on the team can be assigned this project's work. You always have access as its manager.
        </Text>

        <Group align="flex-end" gap="xs">
          <Select
            style={{ flex: 1 }}
            label="Add a person"
            placeholder={candidates.length ? "Select a person" : "Everyone is already on the team"}
            data={candidates.map((p) => ({ value: p.id, label: `${p.name} (${p.role})` }))}
            value={personId}
            onChange={setPersonId}
            searchable
            disabled={!candidates.length}
          />
          <Button
            leftSection={<IconUserPlus size={16} />}
            disabled={!personId}
            loading={setMember.isPending}
            onClick={() => personId && change(personId, true)}
          >
            Add
          </Button>
        </Group>

        <Stack gap={6}>
          <Text size="sm" fw={600}>
            On this team ({team.length})
          </Text>
          {team.length === 0 && (
            <Text size="sm" c="dimmed">
              Nobody yet.
            </Text>
          )}
          {team.map((p) => (
            <Group key={p.id} justify="space-between">
              <Text size="sm">
                {p.name}{" "}
                <Text span size="xs" c="dimmed">
                  ({p.role})
                </Text>
              </Text>
              <Tooltip label="Remove from team (only once they have no open tasks or blockers here)">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={`Remove ${p.name}`}
                  loading={setMember.isPending}
                  onClick={() => change(p.id, false)}
                >
                  <IconUserMinus size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ))}
        </Stack>

        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}
      </Stack>
    </Modal>
  );
}
