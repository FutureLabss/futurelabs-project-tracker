import type { AdminWorkspace } from "../../../api/hooks/use-admin-workspace";

export const isOpen = (task: { status: string }) =>
  !["accepted", "cancelled"].includes(task.status);
export const readable = (value: string) => value.replaceAll("_", " ");
export function eligiblePeople(data: AdminWorkspace, projectId: string) {
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) return [];

  const projectMemberIds = new Set(
    data.members
      .filter((member) => member.projectId === projectId)
      .map((member) => member.personId),
  );

  return data.people.filter(
    (p) =>
      p.status !== "inactive" &&
      (p.role === "admin" ||
        p.id === project.managerId ||
        projectMemberIds.has(p.id)),
  );
}
// Quote every cell, escape CSV quotes, and neutralize spreadsheet formula input.
export function toCsv(rows: unknown[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let cell = String(value ?? "");
          if (/^[\s]*[=+@-]/.test(cell) || /^[\t\r\n]/.test(cell))
            cell = "'" + cell;
          return '"' + cell.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
export function downloadCsv(name: string, rows: unknown[][]) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
