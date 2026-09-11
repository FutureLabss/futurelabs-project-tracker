import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LeaveRecord } from '../../../../types/dashboard';

interface RecordLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordLeave: (record: Omit<LeaveRecord, 'id' | 'createdAt'>) => void;
  defaultDate?: string;
}

export default function RecordLeaveModal({
  isOpen,
  onClose,
  onRecordLeave,
  defaultDate = '2026-09-11',
}: RecordLeaveModalProps) {
  const [member, setMember] = useState('Alex Chen (member)');
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState('2026-09-13');
  const [reason, setReason] = useState('Annual Leave');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) {
      setError('Please select a team member');
      return;
    }
    if (!fromDate || !toDate) {
      setError('From and To dates are required');
      return;
    }
    if (!reason.trim()) {
      setError('Leave note / reason is required');
      return;
    }

    onRecordLeave({
      member,
      fromDate,
      toDate,
      reason: reason.trim(),
    });

    setError('');
    onClose();
  };

  return (
    <div
      id="record-leave-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="record-leave-modal"
        className="w-full max-w-[500px] rounded-xl bg-white p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[19px] font-bold text-slate-900">
            Record Leave / Unavailability
          </h2>
          <button
            type="button"
            id="close-record-leave-btn"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
          Recorded leaves automatically suppress staleness and inactivity alerts during
          the absence period.
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Team Member */}
          <div>
            <label className="block text-[13px] font-medium text-slate-800">
              Team Member <span className="text-red-500">*</span>
            </label>
            <select
              id="leave-team-member"
              value={member}
              onChange={(e) => setMember(e.target.value)}
              className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
            >
              <option value="Alex Chen (member)">Alex Chen (member)</option>
              <option value="Maya Patel (member)">Maya Patel (member)</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] font-medium text-slate-800">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                id="leave-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-800">
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                id="leave-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
              />
            </div>
          </div>

          {/* Leave Note / Reason */}
          <div>
            <label className="block text-[13px] font-medium text-slate-800">
              Leave Note / Reason <span className="text-red-500">*</span>
            </label>
            <input
              id="leave-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual Leave, Medical, Conference"
              className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 px-3 text-[14px] text-slate-800 outline-none transition focus:border-[#08b486]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              id="cancel-record-leave-btn"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-record-leave-btn"
              className="rounded-lg bg-[#08b486] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#079f78] shadow-sm"
            >
              Record Leave
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
