// src/app/ManagerDashboard.tsx

import { useState } from "react";

import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Clock3,
  Flame,
  Folder,
  Plus,
  Users,
} from "lucide-react";

import {
  criticalExceptions,
  agingWorkItems,
  managerStats,
  managers,
  type AttentionItem,
} from "../data/mockData";

import AttentionCard from "../components/horizons/manager/AttentionCard";

const statIcons = {
  flame: Flame,
  clipboard: ClipboardCheck,
  folder: Folder,
  users: Users,
};

const statColors = {
  red: "bg-red-50 text-red-500",
  purple: "bg-purple-50 text-purple-500",
  blue: "bg-blue-50 text-blue-500",
  green: "bg-emerald-50 text-emerald-500",
};

export default function ManagerDashboard() {
  const [selectedManager, setSelectedManager] = useState(managers[0]);

  const handleInspect = (item: AttentionItem) => {
    console.log("Inspecting:", item);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Manager selector */}
          <div className="relative">
            <select
              value={selectedManager.id}
              onChange={(event) => {
                const manager = managers.find(
                  (item) => item.id === event.target.value
                );

                if (manager) {
                  setSelectedManager(manager);
                }
              }}
              className="h-10 min-w-[325px] appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm font-medium text-gray-700 outline-none focus:border-emerald-400"
            >
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.role})
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              ▾
            </div>
          </div>

          {/* Manager badge */}
          <span className="rounded-md bg-purple-50 px-3 py-1.5 text-xs font-bold tracking-wide text-purple-600">
            MANAGER
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="px-5 py-5">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              {selectedManager.name} — Manager Horizon (Lead)
            </h1>

            <p className="mt-1 text-base text-gray-400">
              Operational attention radar, gate review queue, team workload,
              and live audit ledger
            </p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600">
            <Plus size={20} />
            Create Task
          </button>
        </div>

        {/* Statistics */}
        <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {managerStats.map((stat) => {
            const Icon = statIcons[stat.icon as keyof typeof statIcons];

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium tracking-wide text-gray-400">
                      {stat.label}
                    </p>

                    <p className="mt-3 text-2xl font-bold text-gray-950">
                      {stat.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      statColors[stat.color]
                    }`}
                  >
                    <Icon size={25} strokeWidth={1.8} />
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-400">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* Attention Radar */}
        <section className="mt-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Radar heading */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={24}
                className="text-emerald-500"
                strokeWidth={2}
              />

              <h2 className="text-xl font-bold text-gray-950">
                Operational Attention Radar (6)
              </h2>
            </div>

            <span className="inline-flex items-center gap-2 rounded-md bg-red-500 px-3 py-1.5 text-xs font-bold text-white">
              <Flame size={14} />
              1 SILENT OVERRUN(S) PINNED
            </span>

            <p className="ml-auto text-xs text-gray-400">
              Ranked deterministically by temporal risk • Click Inspect on any
              card
            </p>
          </div>

          {/* Critical section */}
          <div className="mt-7">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-500">
              <Flame size={18} />
              Pinned Critical Exceptions (Overdue + Stale Activity)
            </div>

            <div className="space-y-4">
              {criticalExceptions.map((item) => (
                <AttentionCard
                  key={item.id}
                  item={item}
                  onInspect={handleInspect}
                />
              ))}
            </div>
          </div>

          {/* Aging WIP section */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400">
              <AlertTriangle size={18} className="text-amber-500" />
              Aging WIP, Blockers & Unassigned Items
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {agingWorkItems.map((item) => (
                <AttentionCard
                  key={item.id}
                  item={item}
                  onInspect={handleInspect}
                />
              ))}
            </div>
          </div>

          {/* Footer information */}
          <div className="mt-7 flex flex-wrap items-center gap-5 border-t border-gray-100 pt-5 text-xs text-gray-400">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={15} />
              Live workload monitoring
            </span>

            <span className="inline-flex items-center gap-2">
              <ClipboardCheck size={15} />
              Review gate tracking
            </span>

            <span className="inline-flex items-center gap-2">
              <Check size={15} />
              Audit-ready activity
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}