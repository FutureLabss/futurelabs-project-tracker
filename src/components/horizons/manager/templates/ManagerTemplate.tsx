import { Box, Stack } from "@mantine/core";
import type { ReactNode } from "react";

interface ManagerTemplateProps {
  children: ReactNode;
}

export function ManagerTemplate({ children }: ManagerTemplateProps) {
  return (
    <Box
      style={{ flex: 1, minHeight: "100vh", backgroundColor: "#f8f9fa" }}
      p="xl"
    >
      <Stack gap="xl">{children}</Stack>
    </Box>
  );
}
