export default function AcceptedDeliverables() {
  const deliverables = [
    {
      name: "OAuth2 Authorization Server Config",
      project: "Identity & Access Engine (IAM v2)",
      complexity: "HIGH (3 PTS)",
      complexityColor: "text-fuchsia-500 border-fuchsia-400",
      acceptedOn: "8/18/2026",
    },
    {
      name: "Audit Log DynamoDB Exporter",
      project: "Identity & Access Engine (IAM v2)",
      complexity: "MID (2 PTS)",
      complexityColor: "text-blue-500 border-blue-400",
      acceptedOn: "8/28/2026",
    },
  ];

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5">
        <h2 className="text-base font-bold text-gray-900">
          Accepted Deliverables Track Record (2)
        </h2>

        <p className="text-xs text-gray-400">
          Verified accomplishments • Click any row
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-2 py-3 text-sm font-bold text-gray-900">
                Deliverable
              </th>

              <th className="px-2 py-3 text-sm font-bold text-gray-900">
                Project
              </th>

              <th className="px-2 py-3 text-sm font-bold text-gray-900">
                Complexity
              </th>

              <th className="px-2 py-3 text-sm font-bold text-gray-900">
                Accepted On
              </th>

              <th className="px-2 py-3 text-sm font-bold text-gray-900">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {deliverables.map((deliverable) => (
              <tr
                key={deliverable.name}
                className="cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                {/* Deliverable */}
                <td className="px-2 py-3">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    {deliverable.name}
                  </span>
                </td>

                {/* Project */}
                <td className="px-2 py-3">
                  <span className="text-sm text-gray-500">
                    {deliverable.project}
                  </span>
                </td>

                {/* Complexity */}
                <td className="px-2 py-3">
                  <span
                    className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${deliverable.complexityColor}`}
                  >
                    {deliverable.complexity}
                  </span>
                </td>

                {/* Accepted On */}
                <td className="px-2 py-3">
                  <span className="text-sm text-gray-500">
                    {deliverable.acceptedOn}
                  </span>
                </td>

                {/* Status */}
                <td className="px-2 py-3">
                  <span className="inline-flex rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase text-white">
                    Accepted
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}