import {
  Badge,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';

import {
  IconClipboardList,
  IconClock,
  IconFlame,
  IconTrophy,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';

import { StatCard } from './StatCard';
import { PersonalTasksTable } from './PersonalTasksTable';
import { SharedProjectsTable } from './SharedProjectsTable';
import { AcceptedDeliverablesTable } from './AcceptedDeliverablesTable';
import MemberHeader from './MemberHeader';


interface MemberDashboardProps {
  personId:string;
  personName?:string;
}




export default function MemberDashboard({personId, personName}:MemberDashboardProps) {





  return (
    <Stack
      gap="md"
      p="lg"
      style={{
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
      }}
    >

      {/* =========================
          HEADER
      ========================= */}

      <MemberHeader personName={personName} />


      {/* =========================
          STAT CARDS
      ========================= */}

      <SimpleGrid
        cols={{
          base: 1,
          sm: 2,
          lg: 4,
        }}
      >
        <StatCard
          title="Active Tasks"
          value={4}
          description="In queue"
          color="blue"
          icon={
            <IconClipboardList size={18} />
          }
        />

        <StatCard
          title="Size-Weighted Load"
          value="9 pts"
          description="Complexity sum (1/2/3)"
          color="grape"
          icon={
            <IconFlame size={18} />
          }
        />

        <StatCard
          title="Overdue Tasks"
          value={1}
          description="Action needed"
          color="red"
          icon={
            <IconClock size={18} />
          }
        />

        <StatCard
          title="Accepted This Month"
          value={0}
          description="0 complexity pts"
          color="teal"
          icon={
            <IconTrophy size={18} />
          }
        />
      </SimpleGrid>


      {/* =========================
          TABS
      ========================= */}

      <Tabs
        defaultValue="my-work"
      >

        <Tabs.List>

          <Tabs.Tab
            value="my-work"
            leftSection={
              <IconUser size={15} />
            }
          >
            My Active Work

            <Badge
              ml={6}
              size="xs"
              color="blue"
              variant="filled"
            >
              5
            </Badge>
          </Tabs.Tab>


          <Tabs.Tab
            value="shared-work"
            leftSection={
              <IconUsers size={15} />
            }
          >
            Teammates' Tasks (Shared Projects)

            <Badge
              ml={6}
              size="xs"
              color="gray"
              variant="light"
            >
              4
            </Badge>
          </Tabs.Tab>

        </Tabs.List>


        {/* =========================
            MY ACTIVE WORK
        ========================= */}

        <Tabs.Panel
          value="my-work"
          pt="md"
        >
          <Paper
            withBorder
            radius="md"
            p="md"
          >

            <Stack gap="md">

              <Group
                justify="space-between"
                align="flex-start"
              >
                <Stack gap={3}>

                  <Group gap="xs">

                    <IconUser
                      size={20}
                      color="var(--mantine-color-blue-6)"
                    />

                    <Title order={5}>
                      My Active Work
                    </Title>

                  </Group>

                  <Text
                    size="xs"
                    c="dimmed"
                  >
                    Your active tasks, deadlines, and
                    current execution status
                  </Text>

                </Stack>

              </Group>

              <PersonalTasksTable personId={personId} />

            </Stack>

          </Paper>
        </Tabs.Panel>


        {/* =========================
            SHARED PROJECTS
        ========================= */}

        <Tabs.Panel
          value="shared-work"
          pt="md"
        >
          <Paper
            withBorder
            radius="md"
            p="md"
          >
            <SharedProjectsTable />
          </Paper>
        </Tabs.Panel>

      </Tabs>


      {/* =========================
          ACCEPTED DELIVERABLES
      ========================= */}

    

<Paper
  withBorder
  radius="md"
  p="md"
>
  <Stack gap="md">

    <Group
      justify="space-between"
      align="center"
    >
      <Title order={5}>
        Accepted Deliverables Track Record (3)
      </Title>

      <Text
        size="xs"
        c="dimmed"
      >
        Verified accomplishments • Click any row
      </Text>
    </Group>

    <AcceptedDeliverablesTable />

  </Stack>
</Paper>

    </Stack>
  );
}