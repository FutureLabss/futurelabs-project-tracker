import { UserRound, UsersRound } from 'lucide-react';
import { MemberView } from '../../../types/dashboard';

interface MemberWorkTabsProps {
  activeTab: MemberView;
  onTabChange: (tab: MemberView) => void;
  myWorkCount?: number;
  teamCount?: number;
}

export default function MemberWorkTabs({
  activeTab,
  onTabChange,
  myWorkCount = 4,
  teamCount = 4,
}: MemberWorkTabsProps) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex items-end gap-0">
        <button
          type="button"
          id="tab-my-work"
          onClick={() => onTabChange('my-work')}
          className={`flex h-[45px] items-center gap-3 rounded-t-[9px] border px-5 text-[15px] font-medium transition ${
            activeTab === 'my-work'
              ? 'border-slate-200 border-b-white bg-white text-slate-950 shadow-xs'
              : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserRound size={18} strokeWidth={1.8} />

          <span>My Active Work</span>

          <span
            className={`flex h-[21px] min-w-[21px] items-center justify-center rounded-[5px] px-1.5 text-[11px] font-bold ${
              activeTab === 'my-work'
                ? 'bg-[#218be5] text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {myWorkCount}
          </span>
        </button>

        <button
          type="button"
          id="tab-team"
          onClick={() => onTabChange('team')}
          className={`-ml-px flex h-[45px] items-center gap-3 rounded-t-[9px] border px-5 text-[15px] font-medium transition ${
            activeTab === 'team'
              ? 'border-slate-200 border-b-white bg-white text-slate-950 shadow-xs'
              : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UsersRound size={18} strokeWidth={1.8} />

          <span>Teammates&apos; Tasks (Shared Projects)</span>

          <span
            className={`flex h-[21px] min-w-[21px] items-center justify-center rounded-[5px] px-1.5 text-[11px] font-bold ${
              activeTab === 'team'
                ? 'bg-[#218be5] text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {teamCount}
          </span>
        </button>
      </div>
    </div>
  );
}
