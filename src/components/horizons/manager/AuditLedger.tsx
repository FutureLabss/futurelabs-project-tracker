import { History } from "lucide-react";

import type { AuditEvent } from "../../../data/mockData";

type AuditLedgerProps = {
  events: AuditEvent[];
};

const eventStyles: Record<AuditEvent["eventType"], string> = {
  "SUBMITTED TO GATE":
    "bg-purple-50 text-purple-500",

  "TASK CREATED":
    "bg-blue-50 text-blue-500",

  "DELIVERABLE ACCEPTED":
    "bg-emerald-50 text-emerald-500",

  "STATUS CHANGED":
    "bg-cyan-50 text-cyan-500",
};

export default function AuditLedger({
  events,
}: AuditLedgerProps) {
  return (
    <section className="mt-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History
            size={24}
            className="text-emerald-500"
            strokeWidth={2}
          />

          <h2 className="text-xl font-bold text-gray-950">
            Immutable Project Audit Ledger
          </h2>
        </div>

        <p className="text-xs text-gray-400">
          Append-only event stream • Click any row to inspect raw record
        </p>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[950px]">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1.6fr_1.8fr_3fr] gap-5 border-b border-gray-200 px-3 pb-3 text-sm font-bold text-gray-950">
            <span>Timestamp</span>
            <span>Actor</span>
            <span>Event Type</span>
            <span>Transition</span>
            <span>Mandatory Justification / Note</span>
          </div>

          {/* Rows */}
          <div>
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                className="grid w-full grid-cols-[1fr_1fr_1.6fr_1.8fr_3fr] gap-5 border-b border-gray-200 px-3 py-4 text-left transition hover:bg-gray-50"
              >
                {/* Timestamp */}
                <span className="text-sm text-gray-400">
                  {event.timestamp}
                </span>

                {/* Actor */}
                <span className="text-sm font-semibold text-blue-500">
                  {event.actor}
                </span>

                {/* Event type */}
                <span>
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-bold ${eventStyles[event.eventType]}`}
                  >
                    {event.eventType}
                  </span>
                </span>

                {/* Transition */}
                <span className="text-sm text-gray-700">
                  {event.transition}
                </span>

                {/* Note */}
                <span className="text-sm text-gray-400">
                  {event.note}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}