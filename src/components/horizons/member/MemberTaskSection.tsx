"use client";

import { Eye, UsersRound } from "lucide-react";
import MemberTaskFilters from "./MemberTaskFilters";
import MemberTaskTable from "./MemberTaskTable";

export default function MemberTaskSection() {
  return (
    <section className="rounded-[10px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      {/* Section Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex gap-3">
          <div className="pt-0.5">
            <UsersRound
              size={24}
              strokeWidth={1.8}
              className="text-[#168ef0]"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-bold text-slate-950">
                Teammates&apos; Tasks &amp; Shared Work (4)
              </h2>

              <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#e9f5ff] px-2 py-1 text-[10px] font-bold tracking-wide text-[#2187dd]">
                <Eye size={12} />
                READ-ONLY INSPECTION
              </span>
            </div>

            <p className="mt-1 text-[14px] text-slate-400">
              Cross-team visibility for peer coordination, blocker awareness,
              and handoffs • Click any row
            </p>
          </div>
        </div>

        <MemberTaskFilters />
      </div>

      {/* Table */}
      <div className="mt-6">
        <MemberTaskTable />
      </div>
    </section>
  );
}