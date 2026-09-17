import { Text } from "@mantine/core";
import type { ReactNode } from "react";

interface EmptyStateProps {
  children?: ReactNode;
  message?: string;
}

export function EmptyState({ children, message = "No data to display." }: EmptyStateProps) {
  return (
    <Text c="dimmed" ta="center">
      {children ?? message}
    </Text>
  );
}
