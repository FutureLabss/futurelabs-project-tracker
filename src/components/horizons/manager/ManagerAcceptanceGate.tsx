import { useState } from "react";

import {
  ClipboardCheck,
  Play,
} from "lucide-react";

import {
  acceptanceItems,
  type AcceptanceItem,
} from "../../../data/mockData";

import AcceptanceInspector from "./AcceptanceInspector";

export default function AcceptanceGate() {
  const [selectedItem, setSelectedItem] =
    useState<AcceptanceItem | null>(null);

  return (
    <>
      {/* =====================================================
          ACCEPTANCE GATE
      ====================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <ClipboardCheck
              size={24}
              className="text-purple-500"
            />

            <h2 className="text-xl font-bold text-gray-950">
              Manager Acceptance Gate (
              {acceptanceItems.length}
              )
            </h2>

            <span className="rounded-md bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-600">
              AWAITING VERIFICATION
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Formal sign-off / rework gate
          </p>
        </div>

        {/* ===================================================
            TABLE HEADER
        ==================================================== */}

        <div className="mt-6 hidden grid-cols-5 gap-5 border-b border-gray-200 px-3 pb-4 text-sm font-bold text-gray-900 md:grid">

          <span>Deliverable</span>

          <span>Project</span>

          <span>Submitted By</span>

          <span>Complexity</span>

          <span className="text-right">
            Action
          </span>
        </div>

        {/* ===================================================
            ACCEPTANCE ITEMS
        ==================================================== */}

        <div className="mt-2 space-y-2">

          {acceptanceItems.map((item) => (
            <div
              key={item.id}
              className="grid cursor-pointer grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 transition hover:bg-gray-100 md:grid-cols-5 md:items-center md:gap-5"
              onClick={() => setSelectedItem(item)}
            >

              {/* ============================================
                  DELIVERABLE
              ============================================= */}

              <div>
                <p className="font-semibold text-gray-900">
                  {item.deliverable}
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  {item.description}
                </p>
              </div>

              {/* ============================================
                  PROJECT
              ============================================= */}

              <div className="text-sm text-gray-700">
                {item.project}
              </div>

              {/* ============================================
                  SUBMITTED BY
              ============================================= */}

              <div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedItem(item);
                  }}
                  className="font-semibold text-blue-500 hover:underline"
                >
                  {item.submittedBy}
                </button>
              </div>

              {/* ============================================
                  COMPLEXITY
              ============================================= */}

              <div>
                <span className="rounded-md border border-emerald-400 px-2.5 py-1 text-xs font-bold text-emerald-500">
                  {item.complexity} ({item.points}{" "}
                  {item.points === 1 ? "PT" : "PTS"})
                </span>
              </div>

              {/* ============================================
                  ACTION
              ============================================= */}

              <div className="flex justify-start md:justify-end">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedItem(item);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-5 py-3 text-sm font-semibold text-purple-600 transition hover:bg-purple-100"
                >
                  <Play size={16} />

                  Review Deliverable
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          INSPECTOR
      ====================================================== */}

      {selectedItem && (
        <AcceptanceInspector
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}