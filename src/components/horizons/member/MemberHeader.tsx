"use client";

import { CalendarOff, Plus } from "lucide-react";

export default function MemberHeader() {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.5px] text-slate-950">
          Alex Chen — Member Horizon (IC)
        </h1>

        <p className="mt-1 text-[15px] text-slate-500">
          Personal execution queue, peer task visibility, and accomplishment
          ledger
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="flex h-[44px] items-center justify-center gap-2 rounded-[9px] border border-slate-400 bg-white px-4 text-[15px] font-medium text-slate-500 transition hover:bg-slate-50"
        >
          <CalendarOff size={17} strokeWidth={1.8} />
          Record Leave / Out of Office
        </button>

        <button
          type="button"
          className="flex h-[44px] items-center justify-center gap-2 rounded-[9px] bg-[#08b486] px-5 text-[15px] font-semibold text-white transition hover:bg-[#079f78]"
        >
          <Plus size={19} strokeWidth={2.2} />
          New Task
        </button>
      </div>
    </div>
  );
}