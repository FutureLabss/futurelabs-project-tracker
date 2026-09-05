"use client";

import { memberTasks } from "./memberMockData";
import MemberTaskRow from "./MemberTaskRow";

export default function MemberTaskTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1350px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-3 pb-4 pt-1 text-left text-[14px] font-bold text-slate-900">
              Task Title &amp; Overview
            </th>

            <th className="px-3 pb-4 pt-1 text-left text-[14px] font-bold text-slate-900">
              Assigned Teammate
            </th>

            <th className="px-3 pb-4 pt-1 text-left text-[14px] font-bold text-slate-900">
              Project
            </th>

            <th className="px-3 pb-4 pt-1 text-left text-[14px] font-bold text-slate-900">
              Complexity
            </th>

            <th className="px-3 pb-4 pt-1 text-left text-[14px] font-bold text-slate-900">
              Due Date
            </th>

            <th className="px-3 pb-4 pt-1 text-left text-[14px] font-bold text-slate-900">
              Status
            </th>

            <th className="px-3 pb-4 pt-1 text-left text-[14px] font-bold text-slate-900">
              Access Mode
            </th>
          </tr>
        </thead>

        <tbody>
          {memberTasks.map((task) => (
            <MemberTaskRow key={task.id} task={task} />
          ))}
        </tbody>
      </table>
    </div>
  );
}