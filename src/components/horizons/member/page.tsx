import { Alert, Text } from "@mantine/core";
import { useMemberWork } from "../../../api/hooks/use-member-work";
import type { MemberView } from "../../../types/dashboard";
import MemberHeader from "./MemberHeader";
import MemberSummaryCards from "./MemberSummaryCards";
import MemberTaskSection from "./MemberTaskSection";
import MemberWorkTabs from "./MemberWorkTabs";
import MemberPersonalTasks from "./MemberPersonalTasks";

interface MemberPageProps {
  personId: string;
  personName?: string;
  date: string;
  activeView: MemberView;
  onViewChange: (view: MemberView) => void;
}

export default function MemberPage({
  activeView,
  onViewChange,
  personId,
  personName,
  date,
}: MemberPageProps) {
  const { personalTasks, teamTasks, isPending, error } = useMemberWork(
    personId,
    date,
  );
  if (error)
    return (
      <Alert color="red" m="lg" title="Could not load member work">
        {error.message}
      </Alert>
    );
  if (isPending)
    return (
      <Text role="status" p="lg">
        Loading member work...
      </Text>
    );
  return (
    <div className="mx-auto max-w-[1800px] px-6 py-8 lg:px-8">
      <MemberHeader name={personName} />
      <div className="mt-7">
        <MemberSummaryCards tasks={personalTasks} date={date} />
      </div>
      {activeView !== "completed" && (
        <div className="mt-6">
          <MemberWorkTabs activeTab={activeView} onTabChange={onViewChange} />
        </div>
      )}
      <div className="mt-5">
        {activeView === "team" ? (
          <MemberTaskSection tasks={teamTasks} />
        ) : (
          <MemberPersonalTasks
            personalTasks={personalTasks}
            completed={activeView === "completed"}
          />
        )}
      </div>
    </div>
  );
}
