import { Badge, Tabs } from "@mantine/core";
import { IconUser, IconUsers } from "@tabler/icons-react";

interface MemberWorkTabsProps {
  activeTab: "my-work" | "team";
  onTabChange: (tab: "my-work" | "team") => void;
}

export default function MemberWorkTabs({
  activeTab,
  onTabChange,
}: MemberWorkTabsProps) {
  return (
    <Tabs
      value={activeTab}
      variant="outline"
      onChange={(value) => {
        if (value === "my-work" || value === "team") onTabChange(value);
      }}
    >
      <Tabs.List aria-label="Member work views">
        <Tabs.Tab
          value="my-work"
          leftSection={<IconUser size={18} stroke={1.8} />}
          rightSection={
            <Badge size="sm" color={activeTab === "my-work" ? "blue" : "gray"}>
              4
            </Badge>
          }
        >
          My Active Work
        </Tabs.Tab>
        <Tabs.Tab
          value="team"
          leftSection={<IconUsers size={18} stroke={1.8} />}
          rightSection={
            <Badge size="sm" color={activeTab === "team" ? "blue" : "gray"}>
              4
            </Badge>
          }
        >
          Teammates&apos; Tasks (Shared Projects)
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}
