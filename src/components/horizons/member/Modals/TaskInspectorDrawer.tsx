import React from 'react';
import {
  X,
  Folder,
  User,
  Clock,
  Send,
  TriangleAlert,
  Calendar,
  Check,
  RotateCcw,
  Activity,
  History,
  ExternalLink,
} from 'lucide-react';
import { PersonalTask } from '../../../../types/dashboard';

interface TaskInspectorDrawerProps {
  isOpen: boolean;
  task: PersonalTask | null;
  onClose: () => void;
  onSubmitForGate: (taskId: string) => void;
  onToggleBlocker: (taskId: string) => void;
  onOpenReschedule: (task: PersonalTask) => void;
}

export default function TaskInspectorDrawer({
  isOpen,
  task,
  onClose,
  onSubmitForGate,
  onToggleBlocker,
  onOpenReschedule,
}: TaskInspectorDrawerProps) {
  if (!isOpen || !task) return null;

  const isAccepted = task.status === 'ACCEPTED';

  const wipPercentage = Math.min(
    100,
    Math.round(((task.wipDays || 1) / (task.wipMaxDays || 10)) * 100)
  );

  return (
    <div
      id="task-inspector-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="task-inspector-panel"
        className="h-full w-full max-w-[700px] overflow-y-auto bg-white shadow-2xl transition-transform"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] font-bold text-slate-900">
              Task Diagnostic &amp; Lifecycle Inspector
            </h2>
            <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              {task.id.toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            id="close-inspector-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-6 p-6">
          {/* Main Title & Overview Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[20px] font-bold text-slate-900">
                    {task.title}
                  </h3>
                  {task.origin === 'UNPLANNED' ? (
                    <span className="inline-flex items-center rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      UNPLANNED WORK
                    </span>
                  ) : (
                    !isAccepted && (
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        PLANNED
                      </span>
                    )
                  )}
                </div>
                <p className="text-[14px] text-slate-500">
                  {task.description}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    task.status === 'ACCEPTED'
                      ? 'border border-[#10b98a] bg-[#e6f8f2] text-[#08b486]'
                      : task.status === 'SUBMITTED'
                      ? 'bg-purple-100 text-purple-700'
                      : task.status === 'BLOCKED'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {task.status.replaceAll('_', ' ')}
                </span>
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="mt-5 grid grid-cols-1 gap-y-3 border-t border-slate-100 pt-4 text-[13px] sm:grid-cols-2 sm:gap-x-4">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-28 text-slate-400">Project</span>
                <span className="flex items-center gap-1.5 font-medium text-[#0c9fa7]">
                  <Folder size={14} />
                  {task.project}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-28 text-slate-400">Assigned Owner</span>
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dff4f5] text-[10px] font-bold text-[#0c9fa7]">
                    {task.assigneeInitial || 'A'}
                  </span>
                  <span>{task.assignee}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-28 text-slate-400">Complexity Weight</span>
                <span
                  className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-bold uppercase ${
                    task.complexity === 'HIGH'
                      ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-600'
                      : task.complexity === 'MID'
                      ? 'border-sky-300 bg-sky-50 text-sky-600'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {task.complexity} ({task.points} PTS)
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-28 text-slate-400">Target Due Date</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      task.overdue ? 'text-[#ff4141]' : 'text-slate-900'
                    }`}
                  >
                    {task.dueDate}
                  </span>
                  {task.overdue && (
                    <span className="rounded bg-[#ff4c4c] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
                      OVERDUE
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-28 text-slate-400">Created Timestamp</span>
                <span className="font-medium text-slate-700">
                  {task.createdAt}
                </span>
              </div>
            </div>
          </div>

          {/* Operational State Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              OPERATIONAL STATE ACTIONS
            </h4>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {!isAccepted && (
                <>
                  {/* Submit for Acceptance Gate */}
                  <button
                    type="button"
                    id="drawer-submit-gate-btn"
                    onClick={() => onSubmitForGate(task.id)}
                    disabled={task.status === 'SUBMITTED'}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition cursor-pointer ${
                      task.status === 'SUBMITTED'
                        ? 'cursor-not-allowed bg-purple-100 text-purple-700'
                        : 'bg-[#6d28d9] text-white hover:bg-[#5b21b6] shadow-sm'
                    }`}
                  >
                    <Send size={14} />
                    {task.status === 'SUBMITTED'
                      ? 'Awaiting Review'
                      : 'Submit for Acceptance Gate'}
                  </button>

                  {/* Raise Blocker / Unblock */}
                  <button
                    type="button"
                    id="drawer-raise-blocker-btn"
                    onClick={() => onToggleBlocker(task.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition cursor-pointer ${
                      task.status === 'BLOCKED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-[#fff1f1] text-[#ff4b4b] border border-rose-200 hover:bg-[#ffe4e4]'
                    }`}
                  >
                    <TriangleAlert size={14} />
                    {task.status === 'BLOCKED' ? 'Clear Blocker' : 'Raise Blocker'}
                  </button>
                </>
              )}

              {/* Reschedule Due Date... */}
              <button
                type="button"
                id="drawer-reschedule-btn"
                onClick={() => onOpenReschedule(task)}
                className="flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-4 py-2 text-[13px] font-semibold text-amber-700 transition hover:bg-amber-50 shadow-sm cursor-pointer"
              >
                <Calendar size={14} />
                Reschedule Due Date...
              </button>
            </div>
          </div>

          {/* Deliverable Artifact & Review Gate History (for Accepted deliverables or tasks with artifact) */}
          {(isAccepted || task.artifact) && task.artifact && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-bold text-slate-900">
                  Deliverable Artifact &amp; Review Gate History
                </h4>
                <span className="rounded bg-[#08b486] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  ACCEPTED SIGN-OFF
                </span>
              </div>

              <div className="mt-4 text-[13px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-slate-500">Artifact URL:</span>
                  <a
                    href={task.artifact.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                  >
                    {task.artifact.url}
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="mt-3">
                  <p className="font-medium text-slate-500">Submission Notes:</p>
                  <p className="mt-1 text-slate-700 leading-relaxed">
                    {task.artifact.notes}
                  </p>
                </div>
              </div>

              {/* Review Gate Decisions Log */}
              {task.artifact.decisions && task.artifact.decisions.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    REVIEW GATE DECISIONS LOG
                  </h5>
                  <div className="mt-3 space-y-2.5">
                    {task.artifact.decisions.map((dec) => (
                      <div
                        key={dec.id}
                        className="rounded-lg border border-slate-200 bg-white p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              dec.status === 'ACCEPTED'
                                ? 'bg-[#e6f8f2] text-[#08b486]'
                                : 'bg-[#ffebeb] text-[#ff4b4b]'
                            }`}
                          >
                            {dec.status}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {dec.timestamp}
                          </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium text-slate-800">
                          Reviewer: <span className="text-slate-900">{dec.reviewer}</span>
                        </p>
                        <p
                          className={`mt-0.5 text-[12px] ${
                            dec.status === 'RETURNED FOR REWORK'
                              ? 'text-[#ff4b4b]'
                              : 'text-slate-600'
                          }`}
                        >
                          Rationale: {dec.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aging WIP Indicator (Only for active / in-progress tasks) */}
          {!isAccepted && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-sky-500" />
                  <h4 className="text-[14px] font-bold text-slate-900">
                    Aging WIP Indicator
                  </h4>
                </div>
                <span className="rounded bg-[#10b98a] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  {task.wipDays || 1} / {task.wipMaxDays || 10} WORKING DAYS
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#10b98a] transition-all duration-300"
                  style={{ width: `${wipPercentage}%` }}
                />
              </div>

              <p className="mt-2 text-[12px] text-slate-500">
                Complexity threshold: {task.wipMaxDays || 10} days (
                {task.complexity} complexity).
              </p>
            </div>
          )}

          {/* Schedule Slip Audit Log */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[15px] font-bold text-slate-900">
                  Schedule Slip Audit Log ({task.slips.length})
                </h4>
                <p className="text-[12px] text-slate-400">
                  Due date revisions with mandatory recorded reasons
                </p>
              </div>
            </div>

            <div className="mt-4">
              {task.slips.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check size={20} strokeWidth={2.5} />
                  </div>
                  <h5 className="mt-3 text-[14px] font-bold text-slate-900">
                    Zero Schedule Slips Recorded
                  </h5>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Original due date preserved. No schedule revisions have been
                    logged.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {task.slips.map((slip) => (
                    <div
                      key={slip.id}
                      className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-[13px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-950">
                          {slip.oldDate} ➔ {slip.newDate}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {slip.timestamp}
                        </span>
                      </div>
                      <p className="mt-1.5 text-slate-700 italic">
                        &ldquo;{slip.reason}&rdquo;
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Logged by: {slip.author}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Immutable Lifecycle Activity Stream */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-[#08b486]" />
                <h4 className="text-[15px] font-bold text-slate-900">
                  Immutable Lifecycle Activity Stream
                </h4>
              </div>
              <span className="text-[12px] text-slate-400">
                {task.events.length} total event(s)
              </span>
            </div>

            {/* Event Timeline */}
            <div className="relative mt-5 pl-7 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#08b486]">
              {task.events.map((event, idx) => {
                const isFirst = idx === 0;
                const isDeliverableAccepted = event.type === 'accepted';
                const isSubmit = event.type === 'submit';
                const isRework = event.type === 'rework';

                const authorBadgeClass =
                  event.author.toUpperCase().includes('KIM') && isRework
                    ? 'bg-[#ffebeb] text-[#ff4b4b]'
                    : event.author.toUpperCase().includes('KIM')
                    ? 'bg-[#dff5ee] text-[#08b486]'
                    : 'bg-[#f4edff] text-[#7c3aed]';

                return (
                  <div key={event.id} className="relative pb-6 last:pb-0">
                    {/* Node Dot / Icon along the vertical timeline */}
                    <div className="absolute -left-7 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#08b486] text-white shadow-sm ring-4 ring-white">
                      {isDeliverableAccepted ? (
                        <Check size={14} strokeWidth={2.8} />
                      ) : isSubmit ? (
                        <Send size={12} strokeWidth={2.2} />
                      ) : isRework ? (
                        <RotateCcw size={12} strokeWidth={2.2} />
                      ) : (
                        <Activity size={12} strokeWidth={2.2} />
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-white p-3.5 shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-bold text-slate-900">
                            {event.title}
                          </p>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${authorBadgeClass}`}
                          >
                            {event.author}
                          </span>
                        </div>
                        <History size={13} className="text-slate-300" />
                      </div>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {event.timestamp}
                      </p>

                      {event.transition && (
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          {event.transition}
                        </p>
                      )}

                      {event.note && (
                        <p className="mt-1 text-[12px] font-medium text-amber-600">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

