import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Center,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
export function SupabaseLoginScreen({
  onSignIn,
}: {
  onSignIn: (email: string, password: string) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await onSignIn(email, password);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setPassword("");
      setPending(false);
    }
  }
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
            Sign in with your Tracker account or continue with LMS.
          </Text>
          <form onSubmit={submit}>
            <Stack>
              <TextInput
                label="Email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                disabled={pending}
              />
              <PasswordInput
                label="Password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                disabled={pending}
              />
              {error && (
                <Alert color="red" role="alert">
                  {error}
                </Alert>
              )}
              <Button type="submit" loading={pending}>
                Sign in
              </Button>
            </Stack>
          </form>
          <Divider label="or" labelPosition="center" />
          {lmsUrl ? (
            <Button
              component="a"
              href={lmsUrl}
              variant="default"
              aria-disabled={pending}
              onClick={(event) => {
                if (pending) event.preventDefault();
              }}
            >
              Login with LMS
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
