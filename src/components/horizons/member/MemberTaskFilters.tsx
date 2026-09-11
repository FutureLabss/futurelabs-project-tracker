import React from 'react';
import { ChevronDown, Funnel } from 'lucide-react';

interface MemberTaskFiltersProps {
  selectedProject: string;
  onProjectChange: (project: string) => void;
}

export default function MemberTaskFilters({
  selectedProject,
  onProjectChange,
}: MemberTaskFiltersProps) {
  return (
    <div className="relative w-full sm:w-[262px]">
      <Funnel
        size={16}
        strokeWidth={1.8}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <select
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value)}
        className="h-[38px] w-full appearance-none rounded-[9px] border border-slate-300 bg-white pl-9 pr-9 text-[14px] font-medium text-slate-700 outline-none transition focus:border-[#11b88a]"
      >
        <option value="all">All Shared Projects</option>
        <option value="Mobile SDK Onboarding">Mobile SDK Onboarding</option>
        <option value="Data Ingestion & Analytics Pipeline">
          Data Ingestion &amp; Analytics Pipeline
        </option>
        <option value="Identity & Access Engine (IAM v2)">
          Identity &amp; Access Engine (IAM v2)
        </option>
      </select>

      <ChevronDown
        size={16}
        strokeWidth={1.8}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}
