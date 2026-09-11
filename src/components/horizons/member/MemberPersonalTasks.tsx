import React from 'react';
import { Send, TriangleAlert, Calendar, Folder } from 'lucide-react';
import { PersonalTask, TaskComplexity } from '../../../types/dashboard';

interface MemberPersonalTasksProps {
  tasks: PersonalTask[];
  completed?: boolean;
  onSelectTask: (task: PersonalTask) => void;
  onSubmitForGate: (taskId: string) => void;
  onToggleBlocker: (taskId: string) => void;
  onOpenReschedule: (task: PersonalTask) => void;
}

function getComplexityStyle(complexity: TaskComplexity) {
  switch (complexity) {
    case 'LOW':
      return 'border-[#10b98a] bg-[#f5fffc] text-[#08a67d]';
    case 'MID':
      return 'border-[#168cf0] bg-[#f7fbff] text-[#168cf0]';
    case 'HIGH':
      return 'border-[#d849ef] bg-[#fff8ff] text-[#c93ae4]';
    default:
      return 'border-slate-300 bg-slate-50 text-slate-600';
  }
}

export default function MemberPersonalTasks({
  tasks,
  completed = false,
  onSelectTask,
  onSubmitForGate,
  onToggleBlocker,
  onOpenReschedule,
}: MemberPersonalTasksProps) {
  const filteredTasks = tasks.filter((t) =>
    completed ? t.status === 'ACCEPTED' : t.status !== 'ACCEPTED'
  );

  return (
    <section className="rounded-[10px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
        <div>
          <h2 className="text-[18px] font-bold text-slate-950">
            {completed ? 'Completed History' : 'Active Work Queue'} ({filteredTasks.length})
          </h2>
          <p className="text-[13px] text-slate-400">
            {completed
              ? 'Your accepted deliverables and accomplishment ledger.'
              : 'Sorted by delivery deadline • Click any row to inspect task'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[13px] font-bold text-slate-900">
              <th className="px-3 pb-3 pt-1">Task Title &amp; Description</th>
              <th className="px-3 pb-3 pt-1">Project</th>
              <th className="px-3 pb-3 pt-1">Complexity</th>
              <th className="px-3 pb-3 pt-1">{completed ? 'Accepted On' : 'Due Date'}</th>
              <th className="px-3 pb-3 pt-1">Status</th>
              {!completed && <th className="px-3 pb-3 pt-1 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/80"
              >
                {/* Task Title & Description */}
                <td className="max-w-[400px] px-3 py-4 align-middle">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-slate-900 transition hover:text-[#08b486]">
                      {task.title}
                    </span>
                    {task.origin === 'UNPLANNED' && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                        UNPLANNED
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
                    {task.description}
                  </p>
                </td>

                {/* Project */}
                <td className="px-3 py-4 align-middle text-[14px]">
                  <span className="font-medium text-[#087cda]">
                    {task.project}
                  </span>
                </td>

                {/* Complexity */}
                <td className="px-3 py-4 align-middle">
                  <span
                    className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[11px] font-bold uppercase ${getComplexityStyle(
                      task.complexity
                    )}`}
                  >
                    {task.complexity} ({task.points} PT{task.points > 1 ? 'S' : ''})
                  </span>
                </td>

                {/* Due Date / Accepted Date */}
                <td className="px-3 py-4 align-middle whitespace-nowrap">
                  {completed ? (
                    <span className="text-[14px] font-medium text-slate-600">
                      {task.acceptedAt?.slice(0, 10) || task.dueDate}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[14px] font-semibold ${
                          task.overdue ? 'text-[#ff4141]' : 'text-slate-800'
                        }`}
                      >
                        {task.dueDate}
                      </span>
                      {task.overdue && (
                        <span className="rounded-[4px] bg-[#ff4c4c] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          OVERDUE
                        </span>
                      )}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="px-3 py-4 align-middle whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      task.status === 'SUBMITTED'
                        ? 'bg-[#f4edff] text-[#7c3aed]'
                        : task.status === 'BLOCKED'
                        ? 'bg-[#fff1f1] text-[#ff4b4b]'
                        : task.status === 'ACCEPTED'
                        ? 'bg-[#e6f8f2] text-[#08b486]'
                        : task.status === 'IN PROGRESS'
                        ? 'bg-[#eaf5ff] text-[#2087dc]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {task.status === 'SUBMITTED'
                      ? 'SUBMITTED (REVIEW)'
                      : task.status.replaceAll('_', ' ')}
                  </span>
                </td>

                {/* Actions */}
                {!completed && (
                  <td className="px-3 py-4 align-middle text-right whitespace-nowrap">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Submit Gate Button for in-progress tasks */}
                      {task.status !== 'SUBMITTED' && task.status !== 'ACCEPTED' && (
                        <button
                          type="button"
                          onClick={() => onSubmitForGate(task.id)}
                          title="Submit for Acceptance Gate"
                          className="flex items-center gap-1 rounded-md border border-[#7c3aed]/30 bg-[#fbf9ff] px-2.5 py-1 text-[11px] font-semibold text-[#7c3aed] transition hover:bg-[#7c3aed] hover:text-white"
                        >
                          <Send size={11} />
                          Submit
                        </button>
                      )}

                      {/* Blocker alert toggle */}
                      {task.status !== 'SUBMITTED' && (
                        <button
                          type="button"
                          onClick={() => onToggleBlocker(task.id)}
                          title={task.status === 'BLOCKED' ? 'Clear blocker' : 'Raise blocker'}
                          className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${
                            task.status === 'BLOCKED'
                              ? 'border-rose-300 bg-rose-50 text-rose-600'
                              : 'border-slate-200 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          <TriangleAlert size={14} />
                        </button>
                      )}

                      {/* Reschedule Calendar Button */}
                      <button
                        type="button"
                        onClick={() => onOpenReschedule(task)}
                        title="Reschedule Due Date (Recorded Audit)"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-300 bg-amber-50/60 text-amber-600 transition hover:bg-amber-100"
                      >
                        <Calendar size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  {completed ? 'No accepted tasks yet.' : 'No active tasks in queue.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
