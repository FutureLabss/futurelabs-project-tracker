"use client";

import { UserRound, UsersRound } from "lucide-react";

interface MemberWorkTabsProps {
  activeTab: "my-work" | "team";
  onTabChange: (tab: "my-work" | "team") => void;
}

export default function MemberWorkTabs({
  activeTab,
  onTabChange,
}: MemberWorkTabsProps) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex items-end gap-0">
        <button
          type="button"
          onClick={() => onTabChange("my-work")}
          className={`flex h-[45px] items-center gap-3 rounded-t-[9px] border px-5 text-[15px] font-medium transition ${
            activeTab === "my-work"
              ? "border-b-white border-slate-200 bg-white text-slate-950"
              : "border-transparent bg-transparent text-slate-700 hover:bg-slate-50"
          }`}
        >
          <UserRound size={18} strokeWidth={1.8} />

          <span>My Active Work</span>

          <span
            className={`flex h-[21px] min-w-[21px] items-center justify-center rounded-[5px] px-1.5 text-[11px] font-bold ${
              activeTab === "my-work"
                ? "bg-[#218be5] text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            4
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("team")}
          className={`-ml-px flex h-[45px] items-center gap-3 rounded-t-[9px] border px-5 text-[15px] font-medium transition ${
            activeTab === "team"
              ? "border-b-white border-slate-200 bg-white text-slate-950"
              : "border-transparent bg-transparent text-slate-700 hover:bg-slate-50"
          }`}
        >
          <UsersRound size={18} strokeWidth={1.8} />

          <span>Teammates&apos; Tasks (Shared Projects)</span>

          <span
            className={`flex h-[21px] min-w-[21px] items-center justify-center rounded-[5px] px-1.5 text-[11px] font-bold ${
              activeTab === "team"
                ? "bg-[#218be5] text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            4
          </span>
        </button>
      </div>
    </div>
  );
}