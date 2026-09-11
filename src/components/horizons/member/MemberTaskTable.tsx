import React from 'react';
import MemberTaskRow from './MemberTaskRow';
import { MemberTask } from './memberMockData';

interface MemberTaskTableProps {
  tasks: MemberTask[];
  onInspect?: (task: MemberTask) => void;
}

export default function MemberTaskTable({ tasks, onInspect }: MemberTaskTableProps) {
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
          {tasks.map((task) => (
            <MemberTaskRow key={task.id} task={task} onInspect={onInspect} />
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-400">
                No teammate tasks match the selected filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
