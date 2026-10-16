import { Alert, Stack } from "@mantine/core";
import { AdminPageHeader } from "../molecules/AdminPageHeader";

interface AdminTemplateProps {
  title: string;
  subtitle: string;
  date: string;
  isFetching: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onNewProject?: () => void;
  onResetDemo?: () => void;
  canResetDemo?: boolean;
  queryError?: string;
  exportError?: string;
  exportNotice?: string;
  onClearExportNotice: () => void;
  metricsGrid?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
  actionDialog?: React.ReactNode;
  detailsDrawer?: React.ReactNode;
}

export function AdminTemplate({
  title,
  subtitle,
  date,
  isFetching,
  onRefresh,
  onExport,
  onNewProject,
  onResetDemo,
  canResetDemo,
  queryError,
  exportError,
  exportNotice,
  onClearExportNotice,
  metricsGrid,
  controls,
  children,
  actionDialog,
  detailsDrawer,
}: AdminTemplateProps) {
  return (
    <Stack gap="lg" p={{ base: "md", md: "xl" }}>
      <AdminPageHeader
        title={title}
        subtitle={subtitle}
        date={date}
        isFetching={isFetching}
        onRefresh={onRefresh}
        onExport={onExport}
        onNewProject={onNewProject}
        onResetDemo={onResetDemo}
        canResetDemo={canResetDemo}
      />

      {queryError && (
        <Alert color="red" title="Refresh failed">
          {queryError} — showing the last loaded records.
        </Alert>
      )}
      {exportError && <Alert color="red">{exportError}</Alert>}
      {exportNotice && (
        <Alert
          color="teal"
          withCloseButton
          onClose={onClearExportNotice}
          role="status"
        >
          {exportNotice}
        </Alert>
      )}

      {metricsGrid}
      {controls}
      {children}
      
      {actionDialog}
      {detailsDrawer}
    </Stack>
  );
}
