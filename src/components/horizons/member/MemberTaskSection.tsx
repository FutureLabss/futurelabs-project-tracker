import { Badge, Card, Text, Title } from "@mantine/core";
import { IconEye, IconUsers } from "@tabler/icons-react";
import MemberTaskFilters from "./MemberTaskFilters";
import type { MemberTask } from "../../../types/member-task";
import MemberTaskTable from "./MemberTaskTable";

export default function MemberTaskSection({ tasks }: { tasks: MemberTask[] }) {
  return (
    <Card component="section" p="lg" shadow="xs">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex gap-3">
          <IconUsers
            size={24}
            stroke={1.8}
            color="var(--mantine-color-blue-6)"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Title order={2} size="h4">
                Teammates&apos; Tasks &amp; Shared Work ({tasks.length})
              </Title>
              <Badge
                color="blue"
                variant="light"
                leftSection={<IconEye size={12} />}
              >
                Read-only inspection
              </Badge>
            </div>
            <Text mt={4} size="sm" c="dimmed">
              Cross-team visibility for peer coordination, blocker awareness,
              and handoffs • Click any row
            </Text>
          </div>
        </div>
        <MemberTaskFilters />
      </div>
      <div className="mt-6">
        <MemberTaskTable tasks={tasks} />
      </div>
    </Card>
  );
}
