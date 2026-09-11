import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TaskComplexity } from '../memberMockData';
import { PersonalTask, TaskOrigin } from '../../../../types/dashboard';
import { initialProjects } from '../../../../data/mockData';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Omit<PersonalTask, 'id' | 'slips' | 'events' | 'createdAt'>) => void;
  currentDate?: string;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  currentDate = '2026-09-14',
}: CreateTaskModalProps) {
  const [project, setProject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('Alex Chen (member)');
  const [complexity, setComplexity] = useState<TaskComplexity>('MID');
  const [origin, setOrigin] = useState<TaskOrigin>('PLANNED');
  const [dueDate, setDueDate] = useState(currentDate);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) {
      setError('Please select a project');
      return;
    }
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    const pointsMap: Record<TaskComplexity, number> = {
      LOW: 1,
      MID: 2,
      HIGH: 3,
    };

    const maxWipMap: Record<TaskComplexity, number> = {
      LOW: 4,
      MID: 6,
      HIGH: 10,
    };

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      project,
      complexity,
      points: pointsMap[complexity],
      dueDate,
      originalDueDate: dueDate,
      status: 'NOT STARTED',
      origin,
      overdue: false,
      acceptedAt: null,
      assignee: 'Alex Chen (You)',
      assigneeInitial: 'AC',
      assigneeRole: 'member',
      wipDays: 0,
      wipMaxDays: maxWipMap[complexity],
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setProject('');
    setError('');
    onClose();
  };

  return (
    <div
      id="create-task-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="create-task-modal"
        className="w-full max-w-[540px] rounded-xl bg-white p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-[19px] font-bold text-slate-900">
            Create New Task
          </h2>
          <button
            type="button"
            id="close-create-task-btn"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project */}
          <div>
            <label className="block text-[13px] font-medium text-slate-800">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              id="new-task-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486] focus:ring-1 focus:ring-[#08b486]"
            >
              <option value="">Select project</option>
              {initialProjects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-[13px] font-medium text-slate-800">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              id="new-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OIDC token exchange"
              className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 px-3 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#08b486] focus:ring-1 focus:ring-[#08b486]"
            />
          </div>

          {/* Description / Scope */}
          <div>
            <label className="block text-[13px] font-medium text-slate-800">
              Description / Scope
            </label>
            <textarea
              id="new-task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe deliverables and acceptance criteria..."
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#08b486] focus:ring-1 focus:ring-[#08b486]"
            />
          </div>

          {/* Two Columns: Assignee & Complexity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] font-medium text-slate-800">
                Assignee
              </label>
              <select
                id="new-task-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
              >
                <option value="Alex Chen (member)">Alex Chen (member)</option>
                <option value="Maya Patel">Maya Patel</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-800">
                Complexity Weight <span className="text-red-500">*</span>
              </label>
              <select
                id="new-task-complexity"
                value={complexity}
                onChange={(e) => setComplexity(e.target.value as TaskComplexity)}
                className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
              >
                <option value="LOW">Low (1 pt)</option>
                <option value="MID">Mid (2 pts)</option>
                <option value="HIGH">High (3 pts)</option>
              </select>
            </div>
          </div>

          {/* Two Columns: Task Origin & Due Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] font-medium text-slate-800">
                Task Origin <span className="text-red-500">*</span>
              </label>
              <select
                id="new-task-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value as TaskOrigin)}
                className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
              >
                <option value="PLANNED">Planned (Sprint / Milestone)</option>
                <option value="UNPLANNED">Unplanned (Triage / Hotfix)</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-800">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                id="new-task-duedate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              id="cancel-create-task-btn"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-create-task-btn"
              className="rounded-lg bg-[#08b486] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#079f78] shadow-sm"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
