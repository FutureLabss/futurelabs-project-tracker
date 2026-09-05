"use client";

import {
  ClipboardList,
  Flame,
  Clock3,
  Trophy,
} from "lucide-react";

const summaryCards = [
  {
    title: "ACTIVE TASKS",
    value: "4",
    description: "In queue",
    icon: ClipboardList,
    iconBg: "bg-[#e8f4ff]",
    iconColor: "text-[#1597f5]",
  },
  {
    title: "SIZE-WEIGHTED LOAD",
    value: "9 pts",
    description: "Complexity sum (1/2/3)",
    icon: Flame,
    iconBg: "bg-[#f8eaff]",
    iconColor: "text-[#ca48e8]",
  },
  {
    title: "OVERDUE TASKS",
    value: "4",
    description: "Action needed",
    icon: Clock3,
    iconBg: "bg-[#ffe9e9]",
    iconColor: "text-[#ff4c4c]",
  },
  {
    title: "ACCEPTED THIS MONTH",
    value: "0",
    description: "0 complexity pts",
    icon: Trophy,
    iconBg: "bg-[#e6f8f2]",
    iconColor: "text-[#10b98a]",
  },
];

export default function MemberSummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="relative min-h-[130px] rounded-[10px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            <div className="pr-14">
              <p className="text-[13px] font-medium tracking-[0.2px] text-slate-500">
                {card.title}
              </p>

              <p className="mt-3 text-[24px] font-bold leading-none text-slate-950">
                {card.value}
              </p>

              <p className="mt-3 text-[14px] text-slate-400">
                {card.description}
              </p>
            </div>

            <div
              className={`absolute right-5 top-5 flex h-[46px] w-[46px] items-center justify-center rounded-[10px] ${card.iconBg}`}
            >
              <Icon
                size={22}
                strokeWidth={1.9}
                className={card.iconColor}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}