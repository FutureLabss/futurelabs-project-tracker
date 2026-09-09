import { NativeSelect } from "@mantine/core";
import { IconFilter } from "@tabler/icons-react";

export default function MemberTaskFilters() {
  return (
    <div className="w-full sm:w-[262px]">
      <NativeSelect
        aria-label="Filter by shared project"
        defaultValue="all"
        leftSection={<IconFilter size={16} stroke={1.8} />}
        data={[
          { value: "all", label: "All Shared Projects" },
          { value: "mobile", label: "Mobile SDK Onboarding" },
          { value: "data", label: "Data Ingestion & Analytics Pipeline" },
          { value: "iam", label: "Identity & Access Engine (IAM v2)" },
        ]}
      />
    </div>
  );
}
