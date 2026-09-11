import React from 'react';

import MemberSummaryCards from './MemberSummaryCards';
import MemberTaskSection from './MemberTaskSection';
import MemberWorkTabs from './MemberWorkTabs';
import MemberPersonalTasks from './MemberPersonalTasks';
import AcceptedDeliverables from './AcceptedDeliverables';
import { AcceptedDeliverable, MemberTask, MemberView, PersonalTask } from '../../../types/dashboard';
import MemberHeader from './MemberHeader';

interface MemberPageProps {
  activeView: MemberView;
  onViewChange: (view: MemberView) => void;
  personalTasks: PersonalTask[];
  teamTasks: MemberTask[];
  acceptedDeliverables: AcceptedDeliverable[];
  onOpenRecordLeave: () => void;
  onOpenNewTask: () => void;
  onSelectTask: (task: PersonalTask) => void;
  onSelectDeliverable?: (item: AcceptedDeliverable) => void;
  onInspectTeamTask?: (task: MemberTask) => void;
  onSubmitForGate: (taskId: string) => void;
  onToggleBlocker: (taskId: string) => void;
  onOpenReschedule: (task: PersonalTask) => void;
  activeCount: number;
  sizeWeightedPoints: number;
  overdueCount: number;
  acceptedMonthCount: number;
  acceptedMonthPoints: number;
}

export default function MemberPage({
  activeView,
  onViewChange,
  personalTasks,
  teamTasks,
  acceptedDeliverables,
  onOpenRecordLeave,
  onOpenNewTask,
  onSelectTask,
  onSelectDeliverable,
  onInspectTeamTask,
  onSubmitForGate,
  onToggleBlocker,
  onOpenReschedule,
  activeCount,
  sizeWeightedPoints,
  overdueCount,
  acceptedMonthCount,
  acceptedMonthPoints,
}: MemberPageProps) {
  return (
    <main className="mx-auto max-w-[1800px] px-6 py-8 lg:px-8">
      {/* Header with Title & Action Buttons */}
      <MemberHeader
        onOpenRecordLeave={onOpenRecordLeave}
        onOpenNewTask={onOpenNewTask}
      />

      {/* 4 Summary Stat Cards */}
      <div className="mt-7">
        <MemberSummaryCards
          activeCount={activeCount}
          sizeWeightedPoints={sizeWeightedPoints}
          overdueCount={overdueCount}
          acceptedMonthCount={acceptedMonthCount}
          acceptedMonthPoints={acceptedMonthPoints}
        />
      </div>

      {/* Work Tabs */}
      {activeView !== 'completed' && (
        <div className="mt-6">
          <MemberWorkTabs
            activeTab={activeView}
            onTabChange={onViewChange}
            myWorkCount={personalTasks.filter((t) => t.status !== 'ACCEPTED').length}
            teamCount={teamTasks.length}
          />
        </div>
      )}

      {/* Main Task List View */}
      <div className="mt-5">
        {activeView === 'team' ? (
          <MemberTaskSection
            tasks={teamTasks}
            onInspect={onInspectTeamTask}
          />
        ) : (
          <MemberPersonalTasks
            tasks={personalTasks}
            completed={activeView === 'completed'}
            onSelectTask={onSelectTask}
            onSubmitForGate={onSubmitForGate}
            onToggleBlocker={onToggleBlocker}
            onOpenReschedule={onOpenReschedule}
          />
        )}
      </div>

      {/* Accepted Deliverables Track Record */}
      <div className="mt-6">
        <AcceptedDeliverables
          deliverables={acceptedDeliverables}
          onSelectDeliverable={onSelectDeliverable}
        />
      </div>
    </main>
  );
}
