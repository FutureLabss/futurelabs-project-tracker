import type { MemberView } from '../../../types/dashboard';
import MemberHeader from './MemberHeader';
import MemberSummaryCards from './MemberSummaryCards';
import MemberTaskSection from './MemberTaskSection';
import MemberWorkTabs from './MemberWorkTabs';
import MemberPersonalTasks from './MemberPersonalTasks';

interface MemberPageProps {
  activeView: MemberView;
  onViewChange: (view: MemberView) => void;
}

export default function MemberPage({ activeView, onViewChange }: MemberPageProps) {
  return (
    <div className="mx-auto max-w-[1800px] px-6 py-8 lg:px-8">
      <MemberHeader />
      <div className="mt-7">
        <MemberSummaryCards />
      </div>
      {activeView !== 'completed' && (
        <div className="mt-6">
          <MemberWorkTabs activeTab={activeView} onTabChange={onViewChange} />
        </div>
      )}
      <div className="mt-5">
        {activeView === 'team' ? (
          <MemberTaskSection />
        ) : (
          <MemberPersonalTasks completed={activeView === 'completed'} />
        )}
      </div>
    </div>
  );
}
