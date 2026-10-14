import { Stack } from '@mantine/core';

interface MemberTemplateProps {
  header: React.ReactNode;
  metricsGrid?: React.ReactNode;
  children: React.ReactNode;
}

export function MemberTemplate({
  header,
  metricsGrid,
  children,
}: MemberTemplateProps) {
  return (
    <Stack
      gap="md"
      p="lg"
      style={{
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      {header}
      {metricsGrid}
      {children}
    </Stack>
  );
}
