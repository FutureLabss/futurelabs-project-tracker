import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { PersonalTask } from '../../../../types/dashboard';

interface RescheduleModalProps {
  isOpen: boolean;
  task: PersonalTask | null;
  onClose: () => void;
  onConfirmReschedule: (taskId: string, newDate: string, reason: string) => void;
}

export default function RescheduleModal({
  isOpen,
  task,
  onClose,
  onConfirmReschedule,
}: RescheduleModalProps) {
  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (task) {
      setNewDueDate(task.dueDate);
      setReason('');
      setTouched(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const isReasonValid = reason.trim().length > 0;
  const showError = touched && !isReasonValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isReasonValid || !newDueDate) return;

    onConfirmReschedule(task.id, newDueDate, reason.trim());
    onClose();
  };

  return (
    <div
      id="reschedule-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="reschedule-modal"
        className="w-full max-w-[500px] rounded-xl bg-white p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[19px] font-bold text-slate-900">
              Reschedule Task Due Date
            </h2>
            <p className="mt-1 text-[13px] text-slate-600">
              <span className="font-semibold text-slate-700">Task:</span>{' '}
              {task.title}
            </p>
          </div>
          <button
            type="button"
            id="close-reschedule-btn"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mandatory Audit Policy Banner */}
        <div className="mt-4 rounded-xl border border-amber-200 bg-[#fffbeb] p-4">
          <div className="flex gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-amber-600">
              <AlertCircle size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-amber-900">
                Mandatory Audit Policy
              </h4>
              <p className="mt-1 text-[12px] leading-relaxed text-amber-800/90">
                All due date revisions are permanently recorded to the immutable
                ledger. A clear, recorded justification is strictly mandatory.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* New Due Date */}
          <div>
            <label className="block text-[13px] font-medium text-slate-800">
              New Due Date <span className="text-red-500">*</span>
            </label>
            <input
              id="reschedule-new-date"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
            />
          </div>

          {/* Justification / Reason */}
          <div>
            <label className="block text-[13px] font-medium text-slate-800">
              Justification / Reason for Slip{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reschedule-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder="Explain the technical or scope cause for adjusting this deadline..."
              className={`mt-1 w-full rounded-lg border p-3 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition ${
                showError
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                  : 'border-slate-300 focus:border-[#08b486]'
              }`}
            />
            {showError && (
              <p className="mt-1 text-[12px] font-medium text-red-500">
                Reason is strictly required
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              id="cancel-reschedule-btn"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-reschedule-btn"
              disabled={!isReasonValid}
              className={`rounded-lg px-5 py-2 text-[14px] font-semibold transition ${
                isReasonValid
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                  : 'cursor-not-allowed bg-slate-200 text-slate-400'
              }`}
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
