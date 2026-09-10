// src/components/dashboard/AttentionCard.tsx

import {
  AlertTriangle,
  Flame,
  Info,
  Clock,
} from "lucide-react";

import type { AttentionItem } from "../../../data/mockData";

type AttentionCardProps = {
  item: AttentionItem;
  onInspect?: (item: AttentionItem) => void;
};

export default function AttentionCard({
  item,
  onInspect,
}: AttentionCardProps) {
  const isCritical = item.type === "critical";

  return (
    <div
      className={[
        "rounded-xl border bg-white p-5 shadow-sm transition",
        isCritical
          ? "border-red-400 hover:shadow-md"
          : "border-gray-200 hover:shadow-md",
      ].join(" ")}
    >
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={[
            "inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-bold",
            isCritical
              ? "bg-red-500 text-white"
              : "bg-amber-400 text-white",
          ].join(" ")}
        >
          {isCritical ? (
            <Flame size={15} />
          ) : (
            <AlertTriangle size={15} />
          )}

          {isCritical ? "CRITICAL: SILENT OVERRUN" : "WARNING"}
        </span>

        <span className="text-sm font-medium text-gray-500">
          {item.project}
        </span>

        <span className="ml-auto rounded-md border border-gray-400 px-2.5 py-1 text-[11px] font-bold text-gray-500">
          ASSIGNEE: {item.assignee}
        </span>
      </div>

      {/* Title */}
      <h3
        className={[
          "mt-4 text-lg font-semibold",
          isCritical ? "text-red-600" : "text-gray-900",
        ].join(" ")}
      >
        {item.title}
      </h3>

      {/* Description */}
      <p className="mt-1 max-w-5xl text-sm leading-6 text-gray-400">
        {item.description}
      </p>

      {/* Action */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={() => onInspect?.(item)}
          className={[
            "rounded-xl px-5 py-3 text-sm font-semibold transition",
            isCritical
              ? "bg-red-50 text-red-500 hover:bg-red-100"
              : "bg-amber-50 text-amber-600 hover:bg-amber-100",
          ].join(" ")}
        >
          {item.actionLabel}
        </button>
      </div>
    </div>
  );
}