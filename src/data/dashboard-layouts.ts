import {
  IconAlertTriangle,
  IconChartBar,
  IconClipboardCheck,
  IconLayoutDashboard,
  IconReportAnalytics,
  IconShieldCheck,
  IconUsers,
  IconUser,
  IconHistory,
} from '@tabler/icons-react';
import { DashboardLayoutConfig, UserRole } from '../types/dashboard';

export const roleDashboards: Record<UserRole, DashboardLayoutConfig> = {
  member: {
    role: 'member',
    roleLabel: 'Member',
    title: '',
    subtitle: '',
    navigation: [
      { label: 'Work', icon: IconUser, memberView: 'work', active: true },
      { label: "Tasks", icon: IconUsers, memberView: 'tasks' },
      { label: 'History', icon: IconHistory, memberView: 'history' },
    ],
    metrics: [],
    primaryActions: [],
    focusPanel: {
      title: '',
      description: '',
      items: [],
    },
    secondaryPanel: {
      title: '',
      description: '',
      items: [],
    },
  },
  manager: {
    role: 'manager',
    roleLabel: 'Manager',
    title: 'Team delivery command',
    subtitle: 'Review submitted work, rebalance load, and remove delivery blockers.',
    navigation: [
      { label: 'Team overview', icon: IconLayoutDashboard, active: true },
      { label: 'Review gate', icon: IconClipboardCheck },
      { label: 'Workload', icon: IconUsers },
      { label: 'Risk queue', icon: IconAlertTriangle },
    ],
    metrics: [
      { label: 'Review queue', value: '3', trend: 'Oldest waiting 2 days', tone: 'violet' },
      { label: 'Active blockers', value: '4', trend: '2 need owner action', tone: 'orange' },
      { label: 'Team capacity', value: '82%', trend: 'Balanced across 5 members', tone: 'teal' },
      { label: 'Aging WIP', value: '5', trend: 'Past complexity threshold', tone: 'red' },
    ],
    primaryActions: [
      { label: 'Review submissions', icon: IconClipboardCheck },
      { label: 'Assign work', icon: IconUsers },
    ],
    focusPanel: {
      title: 'Manager attention',
      description: 'Team items that need facilitation, review, or assignment decisions.',
      items: [
        {
          title: 'External Identity Provider Certs',
          meta: 'Maya Patel - Blocked 4 working days',
          status: 'Escalate',
          tone: 'red',
        },
        {
          title: 'ETL Chunking Algorithm',
          meta: 'Maya Patel - In progress 8 working days',
          status: 'Coach',
          tone: 'orange',
        },
        {
          title: 'Role-Based Route Guards',
          meta: 'Alex Chen - Submitted',
          status: 'Review',
          tone: 'violet',
        },
      ],
    },
    secondaryPanel: {
      title: 'Team load',
      description: 'Capacity and risk snapshot across active contributors.',
      items: [
        {
          title: 'Alex Chen',
          meta: '4 open tasks - 1 unplanned',
          status: 'High load',
          tone: 'orange',
        },
        {
          title: 'Maya Patel',
          meta: '3 open tasks - 1 blocked',
          status: 'Needs help',
          tone: 'red',
        },
      ],
    },
  },
  admin: {
    role: 'admin',
    roleLabel: 'Admin',
    title: 'Portfolio operations',
    subtitle: 'Monitor delivery health, unmanaged work, and organization-level risk trends.',
    navigation: [
      { label: 'Portfolio', icon: IconReportAnalytics, active: true },
      { label: 'Health analytics', icon: IconChartBar },
      { label: 'Governance', icon: IconShieldCheck },
      { label: 'Org risks', icon: IconAlertTriangle },
    ],
    metrics: [
      { label: 'Active initiatives', value: '12', trend: '8 green - 3 amber - 1 red', tone: 'teal' },
      { label: 'Unmanaged projects', value: '2', trend: 'Lead assignment needed', tone: 'red' },
      { label: 'Delivery confidence', value: '74%', trend: '-6% week over week', tone: 'orange' },
      { label: 'Review pass rate', value: '88%', trend: '+4% improvement', tone: 'blue' },
    ],
    primaryActions: [
      { label: 'Assign leads', icon: IconUsers },
      { label: 'Export report', icon: IconReportAnalytics },
    ],
    focusPanel: {
      title: 'Portfolio risks',
      description: 'Organization-level risks that require executive or governance action.',
      items: [
        {
          title: 'Mobile SDK Onboarding',
          meta: 'No manager assigned - Target Aug 28',
          status: 'Red',
          tone: 'red',
        },
        {
          title: 'Data Ingestion & Analytics Pipeline',
          meta: 'Aging WIP concentration in backend stream',
          status: 'Amber',
          tone: 'orange',
        },
        {
          title: 'Identity & Access Engine',
          meta: 'Blocked by external certificates',
          status: 'Amber',
          tone: 'orange',
        },
      ],
    },
    secondaryPanel: {
      title: 'Governance queue',
      description: 'High-level controls and process signals for portfolio hygiene.',
      items: [
        {
          title: 'Manager coverage audit',
          meta: '2 active projects lack designated leads',
          status: 'Action',
          tone: 'red',
        },
        {
          title: 'Acceptance gate trend',
          meta: 'Return rate stable under threshold',
          status: 'Healthy',
          tone: 'teal',
        },
      ],
    },
  },
};
