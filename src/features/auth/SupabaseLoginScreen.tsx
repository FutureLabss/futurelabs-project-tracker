import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { AuthService } from "../../services/auth-service";

export function SupabaseLoginScreen({ auth }: { auth: AuthService }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await auth.signIn(email, password);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Center mih="100vh" p="lg">
      <Card withBorder radius="md" p="xl" w="100%" maw={440}>
        <form onSubmit={submit}>
          <Stack>
            <Title order={1} size="h2">
              Futurelabs Project Tracker
            </Title>
            <Text c="dimmed">Sign in with your team account.</Text>
            {error && (
              <Alert color="red" role="alert">
                {error}
              </Alert>
            )}
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
            <Button type="submit" loading={pending}>
              Sign in
            </Button>
            <Text size="sm" c="dimmed">
              Contact your administrator if you need an account or password
              reset.
            </Text>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
