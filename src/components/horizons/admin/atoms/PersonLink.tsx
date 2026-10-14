import { Anchor } from "@mantine/core";

interface PersonLinkProps {
  name: string;
  onClick: () => void;
  fw?: number;
}

export function PersonLink({ name, onClick, fw }: PersonLinkProps) {
  return (
    <Anchor component="button" ta="left" fw={fw} onClick={onClick}>
      {name}
    </Anchor>
  );
}
