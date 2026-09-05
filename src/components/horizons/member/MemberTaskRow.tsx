"use client";

import { Eye, TriangleAlert } from "lucide-react";
import type { MemberTask } from "./memberMockData";

interface MemberTaskRowProps {
  task: MemberTask;
}

function complexityClasses(complexity: MemberTask["complexity"]) {
  switch (complexity) {
    case "LOW":
      return "border-[#10b98a] bg-[#f5fffc] text-[#08a67d]";

    case "MID":
      return "border-[#168cf0] bg-[#f7fbff] text-[#168cf0]";

    case "HIGH":
      return "border-[#d849ef] bg-[#fff8ff] text-[#c93ae4]";

    default:
      return "";
  }
}

function statusClasses(status: MemberTask["status"]) {
  switch (status) {
    case "NOT STARTED":
      return "bg-slate-100 text-slate-400";

    case "IN PROGRESS":
      return "bg-[#eaf5ff] text-[#2087dc]";

    case "BLOCKED":
      return "bg-[#fff0f0] text-[#ff4b4b]";

    default:
      return "";
  }
}

export default function MemberTaskRow({ task }: MemberTaskRowProps) {
  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      {/* Task */}
      <td className="min-w-[360px] px-3 py-4 align-middle">
        <div>
          <p className="text-[16px] font-semibold text-slate-900">
            {task.title}
          </p>

          <p className="mt-1 text-[14px] leading-5 text-slate-400">
            {task.description}
          </p>
        </div>
      </td>

      {/* Assigned Teammate */}
      <td className="min-w-[180px] px-3 py-4 align-middle">
        {task.assignee === "UNASSIGNED" ? (
          <span className="inline-flex items-center rounded-[5px] border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-500">
            <span className="mr-1.5 h-[6px] w-[6px] rounded-full bg-slate-400" />
            UNASSIGNED
          </span>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#dff4f5] text-[14px] font-semibold text-[#0c9fa7]">
              {task.assigneeInitial}
            </div>

            <div>
              <p className="text-[14px] font-medium text-[#1683dd]">
                {task.assignee}
              </p>

              <p className="text-[13px] text-slate-400">
                {task.assigneeRole}
              </p>
            </div>
          </div>
        )}
      </td>

      {/* Project */}
      <td className="min-w-[245px] px-3 py-4 align-middle">
        <p className="text-[14px] font-medium leading-5 text-[#087cda]">
          {task.project}
        </p>
      </td>

      {/* Complexity */}
      <td className="min-w-[115px] px-3 py-4 align-middle">
        <span
          className={`inline-flex rounded-[5px] border px-2 py-1 text-[11px] font-bold ${complexityClasses(
            task.complexity
          )}`}
        >
          {task.complexity} ({task.points} PT{task.points > 1 ? "S" : ""})
        </span>
      </td>

      {/* Due Date */}
      <td className="min-w-[175px] px-3 py-4 align-middle">
        <div className="flex items-center gap-2">
          <span
            className={`text-[14px] font-semibold ${
              task.overdue ? "text-[#ff4141]" : "text-slate-700"
            }`}
          >
            {task.dueDate}
          </span>

          {task.overdue && (
            <span className="rounded-[5px] bg-[#ff4c4c] px-2 py-1 text-[10px] font-bold text-white">
              OVERDUE
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="min-w-[140px] px-3 py-4 align-middle">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-[5px] px-2 py-1 text-[10px] font-bold ${statusClasses(
              task.status
            )}`}
          >
            {task.status}
          </span>

          {task.status === "BLOCKED" && (
            <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#ffe8e8] px-2 py-1 text-[10px] font-bold text-[#ff4c4c]">
              <TriangleAlert size={11} />
              BLOCKED
            </span>
          )}
        </div>
      </td>

      {/* Access */}
      <td className="min-w-[165px] px-3 py-4 align-middle">
        <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#e9f5ff] px-2 py-1 text-[10px] font-bold text-[#2187dd]">
          <Eye size={12} strokeWidth={2} />
          {task.accessMode}
        </span>
      </td>
    </tr>
  );
}