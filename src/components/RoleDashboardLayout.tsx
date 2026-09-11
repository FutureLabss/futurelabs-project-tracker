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
import { AcceptedDeliverable, DashboardLayoutConfig, DashboardPanel as DashboardPanelConfig, DashboardTone, LeaveRecord, MemberTask, MemberView, PersonalTask } from '../types/dashboard';
import MemberPage from './horizons/member/Memberpage';
import TaskInspectorDrawer from './horizons/member/Modals/TaskInspectorDrawer';
import RescheduleModal from './horizons/member/Modals/RescheduleModal';
import RecordLeaveModal from './horizons/member/Modals/RecordLeaveModal';
import CreateTaskModal from './horizons/member/Modals/CreateTaskModal';
import { CheckCircle2 } from 'lucide-react';
import { initialAcceptedDeliverables, initialPersonalTasks, memberTasks } from '../data/mockData';

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
  const [memberView, setMemberView] = useState<MemberView>('my-work');
  const ToggleIcon = isNavigationCollapsed
    ? IconLayoutSidebarLeftExpand
    : IconLayoutSidebarLeftCollapse;
  const panels = [config.focusPanel, config.secondaryPanel].filter(
    (panel) => panel.title || panel.description || panel.items.length > 0,

  );

  const [activeView, setActiveView] = useState<MemberView>('my-work');
  const [currentDate, setCurrentDate] = useState('2026-09-01');

  // Datasets
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>(
    JSON.parse(JSON.stringify(initialPersonalTasks))
  );
  const [teamTasks, setTeamTasks] = useState<MemberTask[]>(
    JSON.parse(JSON.stringify(memberTasks))
  );
  const [acceptedDeliverables, setAcceptedDeliverables] = useState<
    AcceptedDeliverable[]
  >(JSON.parse(JSON.stringify(initialAcceptedDeliverables)));
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);

  // Modals & Drawers state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isRecordLeaveOpen, setIsRecordLeaveOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [taskToReschedule, setTaskToReschedule] = useState<PersonalTask | null>(
    null
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

 
  

  // Dynamically evaluate overdue status based on current Time Machine date
  const processedPersonalTasks = useMemo(() => {
    return personalTasks.map((task) => {
      const isOverdue =
        task.status !== 'ACCEPTED' &&
        task.dueDate < currentDate;
      return {
        ...task,
        overdue: isOverdue,
      };
    });
  }, [personalTasks, currentDate]);

  // Statistics calculation
  const activeTasks = processedPersonalTasks.filter(
    (t) => t.status !== 'ACCEPTED'
  );
  const activeCount = activeTasks.length;
  const sizeWeightedPoints = activeTasks.reduce(
    (sum, t) => sum + (t.points || 0),
    0
  );
  const overdueCount = activeTasks.filter((t) => t.overdue).length;

  // Accepted in the current simulation month
  const currentMonthPrefix = currentDate.slice(0, 7); // e.g. "2026-09"
  const acceptedMonthTasks = processedPersonalTasks.filter(
    (t) => t.status === 'ACCEPTED' && t.acceptedAt?.startsWith(currentMonthPrefix)
  );
  const acceptedMonthCount = acceptedMonthTasks.length;
  const acceptedMonthPoints = acceptedMonthTasks.reduce(
    (sum, t) => sum + (t.points || 0),
    0
  );

  // Handlers
  const handleCreateTask = (
    taskData: Omit<PersonalTask, 'id' | 'slips' | 'events' | 'createdAt'>
  ) => {
    const newId = `task-${Date.now().toString().slice(-4)}`;
    const nowTimestamp = new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const newTask: PersonalTask = {
      ...taskData,
      id: newId,
      createdAt: nowTimestamp,
      slips: [],
      events: [
        {
          id: `ev-${Date.now()}`,
          type: 'init',
          title: 'Task Initialized',
          author: 'ALEX CHEN',
          timestamp: nowTimestamp,
          note:
            taskData.origin === 'UNPLANNED'
              ? 'Note: High-priority unplanned triage task'
              : undefined,
        },
      ],
    };

    setPersonalTasks((prev) => [newTask, ...prev]);
    showToast(`Created task: ${newTask.title}`);
  };

  const handleRecordLeave = (
    leaveData: Omit<LeaveRecord, 'id' | 'createdAt'>
  ) => {
    const newRecord: LeaveRecord = {
      ...leaveData,
      id: `leave-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLeaves((prev) => [newRecord, ...prev]);
    showToast(
      `Leave recorded for ${leaveData.member} (${leaveData.fromDate} to ${leaveData.toDate})`
    );
  };

  const handleOpenReschedule = (task: PersonalTask) => {
    setTaskToReschedule(task);
    setIsRescheduleOpen(true);
  };

  const handleConfirmReschedule = (
    taskId: string,
    newDate: string,
    reason: string
  ) => {
    const nowTimestamp = new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const slip = {
      id: `slip-${Date.now()}`,
      oldDate: selectedTask?.dueDate || newDate,
      newDate,
      reason,
      author: 'Alex Chen',
      timestamp: nowTimestamp,
    };

    const event = {
      id: `ev-${Date.now()}`,
      type: 'reschedule' as const,
      title: 'Schedule Revised',
      author: 'ALEX CHEN',
      timestamp: nowTimestamp,
      note: `Due date rescheduled to ${newDate}. Reason: ${reason}`,
    };

    // Update personalTasks if matching
    setPersonalTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = {
            ...t,
            dueDate: newDate,
            slips: [slip, ...t.slips],
            events: [event, ...t.events],
          };

          if (selectedTask?.id === taskId) {
            setSelectedTask(updated);
          }

          return updated;
        }
        return t;
      })
    );

    // Also update acceptedDeliverables if an accepted task was rescheduled
    setAcceptedDeliverables((prev) =>
      prev.map((item) => {
        if (item.taskData && item.taskData.id === taskId) {
          const updatedTaskData = {
            ...item.taskData,
            dueDate: newDate,
            slips: [slip, ...item.taskData.slips],
            events: [event, ...item.taskData.events],
          };
          if (selectedTask?.id === taskId) {
            setSelectedTask(updatedTaskData);
          }
          return {
            ...item,
            taskData: updatedTaskData,
          };
        }
        return item;
      })
    );

    showToast('Schedule slip recorded to immutable audit ledger.');
  };

  const handleSubmitForGate = (taskId: string) => {
    const nowTimestamp = new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    setPersonalTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const event = {
            id: `ev-${Date.now()}`,
            type: 'submit' as const,
            title: 'Submitted for Acceptance Gate',
            author: 'ALEX CHEN',
            timestamp: nowTimestamp,
            note: 'PR ready for peer code review and security acceptance gate',
          };

          const updated = {
            ...t,
            status: 'SUBMITTED' as const,
            events: [event, ...t.events],
          };

          if (selectedTask?.id === taskId) {
            setSelectedTask(updated);
          }

          return updated;
        }
        return t;
      })
    );

    showToast('Task submitted for Acceptance Gate review.');
  };

  const handleToggleBlocker = (taskId: string) => {
    const nowTimestamp = new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    setPersonalTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isCurrentlyBlocked = t.status === 'BLOCKED';
          const newStatus = isCurrentlyBlocked ? 'IN PROGRESS' : 'BLOCKED';

          const event = {
            id: `ev-${Date.now()}`,
            type: isCurrentlyBlocked ? ('unblocked' as const) : ('blocked' as const),
            title: isCurrentlyBlocked ? 'Blocker Cleared' : 'Blocker Raised',
            author: 'ALEX CHEN',
            timestamp: nowTimestamp,
            note: isCurrentlyBlocked
              ? 'External dependency resolved'
              : 'Blocked on external dependency or review bottleneck',
          };

          const updated = {
            ...t,
            status: newStatus as PersonalTask['status'],
            events: [event, ...t.events],
          };

          if (selectedTask?.id === taskId) {
            setSelectedTask(updated);
          }

          return updated;
        }
        return t;
      })
    );

    showToast('Task blocker status updated.');
  };

  const handleSelectTask = (task: PersonalTask) => {
    setSelectedTask(task);
    setIsInspectorOpen(true);
  };

  const handleInspectTeamTask = (t: MemberTask) => {
    // Adapt team task into inspector view format
    const adapted: PersonalTask = {
      id: `TASK-${t.id}`,
      title: t.title,
      description: t.description,
      project: t.project,
      complexity: t.complexity,
      points: t.points,
      dueDate: t.dueDate,
      status: t.status,
      origin: 'PLANNED',
      assignee: t.assignee,
      assigneeInitial: t.assigneeInitial || '?',
      assigneeRole: t.assigneeRole || 'member',
      createdAt: '8/20/2026, 10:00:00 AM',
      wipDays: 3,
      wipMaxDays: t.points * 3,
      slips: [],
      events: [
        {
          id: 'ev-team-1',
          type: 'init',
          title: 'Task Initialized',
          author: t.assignee.toUpperCase(),
          timestamp: '8/20/2026, 10:00:00 AM',
        },
      ],
    };
    setSelectedTask(adapted);
    setIsInspectorOpen(true);
  };

  const handleSelectDeliverable = (deliverable: AcceptedDeliverable) => {
    if (deliverable.taskData) {
      setSelectedTask(deliverable.taskData);
      setIsInspectorOpen(true);
    } else {
      // Fallback if taskData not populated
      const fallbackTask: PersonalTask = {
        id: deliverable.id || 'TASK-HIST-1',
        title: deliverable.name,
        description: 'Verified deliverable with review sign-off.',
        project: deliverable.project,
        complexity: deliverable.complexity.includes('HIGH')
          ? 'HIGH'
          : deliverable.complexity.includes('LOW')
          ? 'LOW'
          : 'MID',
        points: deliverable.points || 2,
        dueDate: deliverable.acceptedOn,
        status: 'ACCEPTED',
        origin: 'PLANNED',
        overdue: false,
        assignee: 'Alex Chen (You)',
        assigneeInitial: 'A',
        createdAt: '8/10/2026, 10:00:00 AM',
        slips: [],
        events: [
          {
            id: 'ev-hist-fall',
            type: 'accepted',
            title: 'Deliverable Accepted',
            author: 'DAVID KIM',
            timestamp: `${deliverable.acceptedOn}, 11:00:00 AM`,
            transition: 'submitted → accepted',
            note: 'Note: Passed review verification gate',
          },
        ],
      };
      setSelectedTask(fallbackTask);
      setIsInspectorOpen(true);
    }
  };


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

          {config.navigation.length > 0 && (
            <Stack gap={4} w="100%">
              {config.navigation.map((item) => {
                const NavigationIcon = item.icon;
                const isActive = config.role === 'member' ? item.memberView === memberView : item.active;
                const navItem = (
                  <UnstyledButton
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      if (item.memberView) setMemberView(item.memberView);
                    }}
                    className={isActive ? 'nav-item nav-item-active' : 'nav-item'}
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
          )}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main className="app-main">
        {config.role === 'member' ? (
          <>
            <MemberPage
              activeView={activeView}
              onViewChange={setActiveView}
              personalTasks={processedPersonalTasks}
              teamTasks={teamTasks}
              acceptedDeliverables={acceptedDeliverables}
              onOpenRecordLeave={() => setIsRecordLeaveOpen(true)}
              onOpenNewTask={() => setIsCreateTaskOpen(true)}
              onSelectTask={handleSelectTask}
              onSelectDeliverable={handleSelectDeliverable}
              onInspectTeamTask={handleInspectTeamTask}
              onSubmitForGate={handleSubmitForGate}
              onToggleBlocker={handleToggleBlocker}
              onOpenReschedule={handleOpenReschedule}
              activeCount={activeCount}
              sizeWeightedPoints={sizeWeightedPoints}
              overdueCount={overdueCount}
              acceptedMonthCount={acceptedMonthCount}
              acceptedMonthPoints={acceptedMonthPoints}
            />

            {/* Modals & Drawers */}
            <CreateTaskModal
              isOpen={isCreateTaskOpen}
              onClose={() => setIsCreateTaskOpen(false)}
              onCreateTask={handleCreateTask}
              currentDate={currentDate}
            />

            <RecordLeaveModal
              isOpen={isRecordLeaveOpen}
              onClose={() => setIsRecordLeaveOpen(false)}
              onRecordLeave={handleRecordLeave}
              defaultDate={currentDate}
            />

            <RescheduleModal
              isOpen={isRescheduleOpen}
              task={taskToReschedule}
              onClose={() => {
                setIsRescheduleOpen(false);
                setTaskToReschedule(null);
              }}
              onConfirmReschedule={handleConfirmReschedule}
            />

            <TaskInspectorDrawer
              isOpen={isInspectorOpen}
              task={selectedTask}
              onClose={() => {
                setIsInspectorOpen(false);
                setSelectedTask(null);
              }}
              onSubmitForGate={handleSubmitForGate}
              onToggleBlocker={handleToggleBlocker}
              onOpenReschedule={handleOpenReschedule}
            />

            {/* Toast Notification */}
            {toastMessage && (
              <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl transition-all">
                <CheckCircle2 size={18} className="text-[#08b486]" />
                <span>{toastMessage}</span>
              </div>
            )}
          </>
        ) : (
    
  
        <Stack gap="xl" className="dashboard-shell">
          <Group justify="space-between" align="flex-start" gap="lg">
            <Box maw={760}>
              <Badge className={roleToneClassNames[config.role]}>{config.roleLabel}</Badge>
              {config.title && (
                <Title order={1} mt="sm">
                  {config.title}
                </Title>
              )}
              {config.subtitle && (
                <Text c="dimmed" mt={6}>
                  {config.subtitle}
                </Text>
              )}
            </Box>

            {config.primaryActions.length > 0 && (
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
            )}
          </Group>

          {config.metrics.length > 0 && (
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
          )}

          {panels.length > 0 && (
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
              {panels.map((panel) => (
                <DashboardPanel key={panel.title} panel={panel} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
        )}
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
