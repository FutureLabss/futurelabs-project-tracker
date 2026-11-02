import { Alert, Button, Card, Center, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

// Access is granted in the LMS, so the only way in is the LMS's Project Tracker link.
export function OpenFromLmsScreen({ children }: { children?: ReactNode }) {
  let lmsUrl: string | undefined;
  try {
    const parsed = new URL(import.meta.env.VITE_LMS_APP_URL ?? "");
    if (parsed.username || parsed.password) throw new Error();
    if (
      parsed.protocol === "https:" ||
      (import.meta.env.DEV &&
        parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(parsed.hostname))
    )
      lmsUrl = parsed.href;
  } catch {
    /* Render configuration error without exposing internals. */
  }
  return (
    <Center mih="100vh" p="lg">
      <Card withBorder radius="md" p="xl" w="100%" maw={440}>
        <Stack>
          <Title order={1} size="h2">
            Futurelabs Project Tracker
          </Title>
          <Text c="dimmed">
            Sign in to the LMS and choose Project Tracker in the sidebar. Access
            is granted by the LMS administrator.
          </Text>
          {children}
          {lmsUrl ? (
            <Button component="a" href={lmsUrl}>
              Go to the LMS
            </Button>
          ) : (
            <Alert color="red">
              LMS sign-in is not configured. Contact your administrator.
            </Alert>
          )}
        </Stack>
      </Card>
    </Center>
  );
}
