"use client";

import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import {
  IconClipboardList,
  IconFlame,
  IconClockHour3,
  IconTrophy,
} from "@tabler/icons-react";

import type { Task } from "../../../entities/task.entity";

export default function MemberSummaryCards({
  tasks,
  date,
}: {
  tasks: Task[];
  date: string;
}) {
  const active = tasks.filter(
    (task) => task.status !== "accepted" && task.status !== "cancelled",
  );
  const accepted = tasks.filter(
    (task) =>
      task.status === "accepted" &&
      task.acceptedAt?.slice(0, 7) === date.slice(0, 7) &&
      task.acceptedAt.slice(0, 10) <= date,
  );
  const points = (items: Task[]) =>
    items.reduce(
      (sum, task) => sum + { low: 1, mid: 2, high: 3 }[task.complexity],
      0,
    );
  const summaryCards = [
    {
      title: "ACTIVE TASKS",
      value: String(active.length),
      description: "In queue",
      icon: IconClipboardList,
      color: "blue",
    },
    {
      title: "SIZE-WEIGHTED LOAD",
      value: String(points(active)) + " pts",
      description: "Complexity sum (1/2/3)",
      icon: IconFlame,
      color: "grape",
    },
    {
      title: "OVERDUE TASKS",
      value: String(active.filter((task) => task.dueDate < date).length),
      description: "Action needed",
      icon: IconClockHour3,
      color: "red",
    },
    {
      title: "ACCEPTED THIS MONTH",
      value: String(accepted.length),
      description: String(points(accepted)) + " complexity pts",
      icon: IconTrophy,
      color: "teal",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} mih={130} p="lg" shadow="xs">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <div>
                <Text size="xs" fw={500} c="dimmed">
                  {card.title}
                </Text>
                <Text mt="sm" size="xl" fw={700} lh={1}>
                  {card.value}
                </Text>
                <Text mt="sm" size="sm" c="dimmed">
                  {card.description}
                </Text>
              </div>
              <ThemeIcon
                size={46}
                radius="md"
                variant="light"
                color={card.color}
              >
                <Icon size={22} stroke={1.9} />
              </ThemeIcon>
            </Group>
          </Card>
        );
      })}
    </div>
  );
}
