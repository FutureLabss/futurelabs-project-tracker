// src/app/ManagerDashboard.tsx

import { useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconClipboardCheck,
  IconFlame,
  IconFolder,
  IconPlus,
  IconUsers,
} from '@tabler/icons-react';

import {
  acceptanceItems,
  agingWorkItems,
  auditEvents,
  criticalExceptions,
  managers,
  managerStats,
  teamMembers,
  type AttentionItem,
} from '../data/mockData';

import AttentionCard from '../components/horizons/manager/AttentionCard';
import CreateTaskModal, {
  type CreatedTask,
} from '../components/horizons/manager/CreateTaskModal';
import ManagerAcceptanceGate from '../components/horizons/manager/ManagerAcceptanceGate';
import TeamCapacity from '../components/horizons/manager/Teamcapacity';
import AuditLedger from '../components/horizons/manager/AuditLedger';
import { StatCard } from '../components/horizons/member/StatCard';

export default function ManagerDashboard() {
  const [selectedManager, setSelectedManager] = useState(managers[0]);
  const [, setSelectedTask] = useState<AttentionItem | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [auditEventsState, setAuditEventsState] = useState(auditEvents);

  const handleInspect = (item: AttentionItem) => {
    setSelectedTask(item);
  };

  const handleTaskCreated = (task: CreatedTask) => {
    const newAuditEvent = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      actor: selectedManager.name,
      eventType: 'TASK CREATED' as const,
      transition: task.title,
      note: task.description,
    };

    setAuditEventsState((previousEvents) => [
      newAuditEvent,
      ...previousEvents,
    ]);
  };

  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'flame':
        return <IconFlame size={20} />;
      case 'clipboard':
        return <IconClipboardCheck size={20} />;
      case 'folder':
        return <IconFolder size={20} />;
      case 'users':
        return <IconUsers size={20} />;
      default:
        return undefined;
    }
  };

  const getStatColor = (colorName: string) => {
    switch (colorName) {
      case 'red':
        return 'red';
      case 'purple':
        return 'grape';
      case 'blue':
        return 'blue';
      case 'green':
        return 'teal';
      default:
        return 'teal';
    }
  };

  return (
    <Box bg="gray.0" mih="100vh" py="xl">
      <Container size="xl">
        {/* =========================================================
            HEADER & PERSONA SWITCHER (Image 1 & Image 2)
        ========================================================= */}
        <Group gap="xs" mb="lg">
          <Avatar color="grape" radius="xl" size="sm">
            DK
          </Avatar>
          <Select
            size="xs"
            w={230}
            value={selectedManager.id}
            data={managers.map((manager) => ({
              value: manager.id,
              label: `${manager.name} (${manager.role})`,
            }))}
            onChange={(val) => {
              const matched = managers.find((m) => m.id === val);
              if (matched) {
                setSelectedManager(matched);
              }
            }}
          />
          <Badge color="grape" variant="light" radius="sm">
            MANAGER
          </Badge>
        </Group>

        <Group justify="space-between" align="flex-start" mb="xl">
          <Stack gap={2}>
            <Title order={2} fw={700} c="dark.9">
              {selectedManager.name} — Manager Horizon (Lead)
            </Title>
            <Text fz="sm" c="dimmed">
              Operational attention radar, gate review queue, team workload, and live audit ledger
            </Text>
          </Stack>

          <Button
            color="teal"
            radius="md"
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateTaskOpen(true)}
          >
            Create Task
          </Button>
        </Group>

        {/* =========================================================
            STATISTICS / KPI CARDS (Image 1)
        ========================================================= */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
          {managerStats.map((stat) => (
            <StatCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              description={stat.description}
              icon={getStatIcon(stat.icon)}
              color={getStatColor(stat.color)}
            />
          ))}
        </SimpleGrid>

        {/* =========================================================
            OPERATIONAL ATTENTION RADAR (Image 1 & Image 2)
        ========================================================= */}
        <Card withBorder radius="md" p="xl" bg="white" mb="xl">
          <Group justify="space-between" align="center" mb="lg">
            <Group gap="sm">
              <ThemeIcon variant="transparent" c="teal.6">
                <IconAlertTriangle size={24} />
              </ThemeIcon>
              <Title order={3} fz="lg" fw={700}>
                Operational Attention Radar ({criticalExceptions.length + agingWorkItems.length})
              </Title>
              <Badge
                color="red"
                variant="filled"
                radius="xl"
                size="md"
                leftSection={<IconFlame size={14} />}
              >
                {criticalExceptions.length} SILENT OVERRUN(S) PINNED
              </Badge>
            </Group>

            <Text fz="xs" c="dimmed">
              Ranked deterministically by temporal risk • Click Inspect on any card
            </Text>
          </Group>

          {/* Subheading: Pinned Critical Exceptions */}
          <Group gap={6} mb="sm">
            <ThemeIcon variant="transparent" c="red" size="sm">
              <IconFlame size={16} />
            </ThemeIcon>
            <Text fz="xs" fw={700} c="red.7" tt="uppercase" lts={0.5}>
              PINNED CRITICAL EXCEPTIONS (OVERDUE + STALE ACTIVITY)
            </Text>
          </Group>

          {/* Pinned Card */}
          <Box mb="xl">
            {criticalExceptions.map((item) => (
              <AttentionCard
                key={item.id}
                item={item}
                onInspect={handleInspect}
              />
            ))}
          </Box>

          {/* Subheading: Aging WIP, Blockers & Unassigned Items */}
          <Group gap={6} mb="sm">
            <ThemeIcon variant="transparent" c="yellow.8" size="sm">
              <IconAlertTriangle size={16} />
            </ThemeIcon>
            <Text fz="xs" fw={700} c="yellow.8" tt="uppercase" lts={0.5}>
              AGING WIP, BLOCKERS & UNASSIGNED ITEMS
            </Text>
          </Group>

          {/* 2-Column Warning Grid */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {agingWorkItems.map((item) => (
              <AttentionCard
                key={item.id}
                item={item}
                onInspect={handleInspect}
              />
            ))}
          </SimpleGrid>
        </Card>

        {/* =========================================================
            MANAGER ACCEPTANCE GATE (Image 3) - Uses ReusableTable
        ========================================================= */}
        <Box mb="xl">
          <ManagerAcceptanceGate items={acceptanceItems} />
        </Box>

        {/* =========================================================
            SIZE-WEIGHTED TEAM CAPACITY (Image 3)
        ========================================================= */}
        <Box mb="xl">
          <TeamCapacity members={teamMembers} />
        </Box>

        {/* =========================================================
            IMMUTABLE PROJECT AUDIT LEDGER (Image 3) - Uses ReusableTable
        ========================================================= */}
        <Box mb="xl">
          <AuditLedger events={auditEventsState} />
        </Box>

        {/* Create Task Modal */}
        <CreateTaskModal
          opened={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          managerName={selectedManager.name}
          onTaskCreated={handleTaskCreated}
        />
      </Container>
    </Box>
  );
}
