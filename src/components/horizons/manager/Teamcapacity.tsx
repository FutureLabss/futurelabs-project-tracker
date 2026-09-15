import type { TeamMember } from "../../../data/mockData";

type TeamCapacityProps = {
  members: TeamMember[];
};

export default function TeamCapacity({
  members,
}: TeamCapacityProps) {
  return (
    <section className="mt-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-950">
          Size-Weighted Team Capacity Distribution
        </h2>

        <p className="text-xs text-gray-400">
          Complexity points sum (Low=1, Mid=2, High=3) • Click any member card
        </p>
      </div>

      {/* Team members */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-gray-300 hover:shadow-sm"
          >
            {/* Name and points */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-blue-500">
                  {member.name}
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  {member.role}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {member.onLeave && (
                  <span className="rounded-md border border-blue-400 bg-white px-2 py-1 text-[11px] font-bold text-blue-500">
                    ON LEAVE
                  </span>
                )}

                <span className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">
                  {member.points} PTS
                </span>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${member.capacityPercentage}%`,
                }}
              />
            </div>

            {/* Bottom information */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {member.activeTasks} active task(s)
              </p>

              {member.overdue > 0 && (
                <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500">
                  {member.overdue} OVERDUE
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}