import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBell,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsRight,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSearch,
  IconSettings,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { DashboardLayoutConfig, DashboardPanel as DashboardPanelConfig, DashboardTone } from '../types/dashboard';

interface RoleDashboardLayoutProps {
  config: DashboardLayoutConfig;
  onLogout: () => void;
}

const expandedNavbarWidth = 252;
const collapsedNavbarWidth = 76;

const toneClassNames: Record<DashboardTone, string> = {
  blue: 'tone-blue',
  gray: 'tone-gray',
  orange: 'tone-orange',
  red: 'tone-red',
  teal: 'tone-teal',
  violet: 'tone-violet',
};

const roleToneClassNames: Record<DashboardLayoutConfig['role'], string> = {
  admin: toneClassNames.teal,
  manager: toneClassNames.violet,
  member: toneClassNames.blue,
};

export function RoleDashboardLayout({ config, onLogout }: RoleDashboardLayoutProps) {
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const ToggleIcon = isNavigationCollapsed
    ? IconLayoutSidebarLeftExpand
    : IconLayoutSidebarLeftCollapse;

  return (
    <AppShell
      header={{ height: { base: 152, sm: 112, xl: 64 } }}
      navbar={{
        width: isNavigationCollapsed ? collapsedNavbarWidth : expandedNavbarWidth,
        breakpoint: 'sm',
      }}
      padding={0}
    >
      <AppShell.Header className="app-header">
        <Group className="app-header-content" px="lg" justify="space-between" wrap="wrap">
          <Group gap="sm" wrap="nowrap">
            <Tooltip label={isNavigationCollapsed ? 'Expand navigation' : 'Collapse navigation'}>
              <ActionIcon
                aria-label={isNavigationCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                aria-pressed={isNavigationCollapsed}
                onClick={() => setIsNavigationCollapsed((current) => !current)}
                size="lg"
              >
                <ToggleIcon size={20} />
              </ActionIcon>
            </Tooltip>
            <Box className="header-title-block">
              <Text fw={700} size="sm">
                Futurelabs Project Tracker
              </Text>
              <Text c="dimmed" size="xs">
                {config.roleLabel} dashboard layout
              </Text>
            </Box>
          </Group>

          <TimeMachineBar />

          <Group gap="xs" wrap="nowrap">
            <Tooltip label="Search">
              <ActionIcon aria-label="Search" size="lg">
                <IconSearch size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Notifications">
              <ActionIcon aria-label="Notifications" size="lg">
                <IconBell size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Settings">
              <ActionIcon aria-label="Settings" size="lg">
                <IconSettings size={20} />
              </ActionIcon>
            </Tooltip>
            <Button variant="light" onClick={onLogout}>
              Sign out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        className={isNavigationCollapsed ? 'app-navbar app-navbar-collapsed' : 'app-navbar'}
        p="md"
      >
        <Stack gap="lg" h="100%" align={isNavigationCollapsed ? 'center' : 'stretch'}>
          <Box className="sidebar-heading">
            {isNavigationCollapsed ? (
              <Tooltip label={`${config.roleLabel} workspace`} position="right">
                <Badge className={roleToneClassNames[config.role]}>{config.roleLabel.charAt(0)}</Badge>
              </Tooltip>
            ) : (
              <>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Workspace
                </Text>
                <Title order={3} size="h5" mt={4}>
                  {config.roleLabel}
                </Title>
              </>
            )}
          </Box>

          <Stack gap={4} w="100%">
            {config.navigation.map((item) => {
              const NavigationIcon = item.icon;
              const navItem = (
                <UnstyledButton
                  aria-label={item.label}
                  className={item.active ? 'nav-item nav-item-active' : 'nav-item'}
                  key={item.label}
                >
                  <Group gap="sm" justify={isNavigationCollapsed ? 'center' : 'flex-start'} wrap="nowrap">
                    <NavigationIcon size={18} />
                    {!isNavigationCollapsed && (
                      <Text size="sm" fw={600}>
                        {item.label}
                      </Text>
                    )}
                  </Group>
                </UnstyledButton>
              );

              return isNavigationCollapsed ? (
                <Tooltip key={item.label} label={item.label} position="right">
                  {navItem}
                </Tooltip>
              ) : (
                navItem
              );
            })}
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main className="app-main">
        <Stack gap="xl" className="dashboard-shell">
          <Group justify="space-between" align="flex-start" gap="lg">
            <Box maw={760}>
              <Badge className={roleToneClassNames[config.role]}>{config.roleLabel}</Badge>
              <Title order={1} mt="sm">
                {config.title}
              </Title>
              <Text c="dimmed" mt={6}>
                {config.subtitle}
              </Text>
            </Box>

            <Group gap="xs">
              {config.primaryActions.map((action) => {
                const ActionIconComponent = action.icon;

                return (
                  <Button key={action.label} leftSection={<ActionIconComponent size={16} />}>
                    {action.label}
                  </Button>
                );
              })}
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md">
            {config.metrics.map((metric) => (
              <Card className="metric-card" key={metric.label}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Box>
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                      {metric.label}
                    </Text>
                    <Text className="metric-value">{metric.value}</Text>
                  </Box>
                  <span className={`metric-dot ${toneClassNames[metric.tone]}`} />
                </Group>
                <Text size="sm" c="dimmed" mt="sm">
                  {metric.trend}
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
            <DashboardPanel panel={config.focusPanel} />
            <DashboardPanel panel={config.secondaryPanel} />
          </SimpleGrid>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}

function TimeMachineBar() {
  const [activeDate, setActiveDate] = useState('2026-09-01');
  const readableDate = useMemo(() => dayjs(activeDate).format('ddd, MMM D, YYYY'), [activeDate]);

  const shiftDate = (days: number) => {
    setActiveDate((currentDate) => dayjs(currentDate).add(days, 'day').format('YYYY-MM-DD'));
  };

  return (
    <Group className="time-machine-bar" gap="xs" wrap="nowrap">
      <Group gap={8} wrap="nowrap" className="time-machine-label">
        <IconCalendarEvent size={22} />
        <Text span fw={800} c="dimmed" size="sm">
          TIME MACHINE:
        </Text>
        <Text span fw={800} c="teal.7" size="sm">
          {readableDate}
        </Text>
      </Group>

      <Tooltip label="Move back one day">
        <ActionIcon aria-label="Move time machine back one day" onClick={() => shiftDate(-1)} size="sm">
          <IconChevronLeft size={17} />
        </ActionIcon>
      </Tooltip>

      <Button className="time-machine-step" onClick={() => shiftDate(1)} rightSection={<IconChevronRight size={15} />}>
        +1 Day
      </Button>
      <Button className="time-machine-step" onClick={() => shiftDate(7)} rightSection={<IconChevronsRight size={15} />}>
        +1 Week
      </Button>

      <TextInput
        aria-label="Time machine date"
        className="time-machine-input"
        type="date"
        value={activeDate}
        onChange={(event) => setActiveDate(event.currentTarget.value)}
      />
    </Group>
  );
}

function DashboardPanel({ panel }: { panel: DashboardPanelConfig }) {
  return (
    <Card className="work-panel">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box>
          <Title order={2} size="h4">
            {panel.title}
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            {panel.description}
          </Text>
        </Box>
        <Tooltip label="Open panel">
          <ActionIcon aria-label={`Open ${panel.title}`} size="lg">
            <IconChevronRight size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Divider my="md" />

      <Stack gap="sm">
        {panel.items.map((item) => (
          <Box className="work-item" key={`${panel.title}-${item.title}`}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Box>
                <Text fw={700} size="sm">
                  {item.title}
                </Text>
                <Text c="dimmed" size="xs" mt={2}>
                  {item.meta}
                </Text>
              </Box>
              <Badge className={toneClassNames[item.tone]}>{item.status}</Badge>
            </Group>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}
