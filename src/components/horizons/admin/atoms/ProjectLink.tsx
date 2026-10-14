import { Anchor } from "@mantine/core";

interface ProjectLinkProps {
  name: string;
  onClick: () => void;
}

export function ProjectLink({ name, onClick }: ProjectLinkProps) {
  return (
    <Anchor component="button" ta="left" onClick={onClick}>
      {name}
    </Anchor>
  );
}
