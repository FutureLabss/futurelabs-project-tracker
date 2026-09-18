import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconLock,
  IconLogin2,
  IconMail,
  IconShieldCheck,
} from "@tabler/icons-react";
import { FormEvent, useState } from "react";
import { Persona } from "../types/dashboard";

interface LoginScreenProps {
  credentials: Persona[];
  onLogin: (person: Persona) => void;
}

export function LoginScreen({ credentials, onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const matchingCredentials = credentials.find(
      (credential) =>
        credential.email === normalizedEmail &&
        credential.password === password,
    );

    if (!matchingCredentials) {
      setError(
        "Invalid email or password. Use one of the sample credentials shown on this screen.",
      );
      return;
    }

    setError("");
    onLogin(matchingCredentials);
  };

  const fillDemoCredentials = (credential: Persona) => {
    setEmail(credential.email);
    setPassword(credential.password);
    setError("");
  };

  return (
    <Box className="login-screen">
      <Box className="login-shell">
        <Box className="login-layout login-layout-signin">
          <Stack className="login-brand-panel" justify="space-between" gap="xl">
            <Box>
              <Group gap="xs" mb="xl">
                <IconShieldCheck size={24} />
                <Text fw={800} size="sm" c="teal.8" tt="uppercase">
                  Futurelabs Project Tracker
                </Text>
              </Group>

              <Title order={1}>Dashboard sign in</Title>
              <Text c="dimmed" mt="sm" size="lg" maw={480}>
                Access role-based dashboards with the sample administrator or
                member account.
              </Text>
            </Box>

            <Card className="demo-login-box">
              <Group justify="space-between" gap="sm" mb="sm">
                <Text size="xs" fw={800} c="dimmed" tt="uppercase">
                  Sample login credentials
                </Text>
                <Button
                  size="compact-xs"
                  variant="light"
                  onClick={() => fillDemoCredentials(credentials[0])}
                >
                  Fill admin
                </Button>
              </Group>
              <Stack gap="sm">
                {credentials.map((credential) => (
                  <Stack key={credential.id} gap={6}>
                    <Group justify="space-between" gap="sm" wrap="nowrap">
                      <Text size="xs" fw={800} c="dimmed" tt="uppercase">
                        {credential.role} account
                      </Text>
                      <Anchor
                        size="xs"
                        fw={700}
                        component="button"
                        type="button"
                        onClick={() => fillDemoCredentials(credential)}
                      >
                        Fill
                      </Anchor>
                    </Group>
                    <Group justify="space-between" gap="md" wrap="nowrap">
                      <Text size="sm" c="dimmed">
                        Email
                      </Text>
                      <Anchor
                        size="sm"
                        fw={700}
                        component="button"
                        type="button"
                        onClick={() => setEmail(credential.email)}
                      >
                        {credential.email}
                      </Anchor>
                    </Group>
                    <Group justify="space-between" gap="md" wrap="nowrap">
                      <Text size="sm" c="dimmed">
                        Password
                      </Text>
                      <Anchor
                        size="sm"
                        fw={700}
                        component="button"
                        type="button"
                        onClick={() => setPassword(credential.password)}
                      >
                        {credential.password}
                      </Anchor>
                    </Group>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Stack>

          <Card className="login-form-panel">
            <form onSubmit={handleSubmit} className="signin-form">
              <Stack gap="lg">
                <Box>
                  <Title order={2} size="h3">
                    Sign in to dashboard
                  </Title>
                  <Text size="sm" c="dimmed" mt={6}>
                    Use a sample account to open the matching dashboard.
                  </Text>
                </Box>

                {error && (
                  <Alert color="red" icon={<IconAlertCircle size={18} />}>
                    {error}
                  </Alert>
                )}

                <Stack gap="md">
                  <TextInput
                    autoComplete="email"
                    label="Email address"
                    leftSection={<IconMail size={17} />}
                    placeholder="admin@futurelabs.io"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                    required
                  />

                  <PasswordInput
                    autoComplete="current-password"
                    label="Password"
                    leftSection={<IconLock size={17} />}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    required
                  />
                </Stack>

                <Group justify="space-between" gap="sm" wrap="nowrap">
                  <Checkbox
                    checked={rememberMe}
                    label="Remember me"
                    onChange={(event) =>
                      setRememberMe(event.currentTarget.checked)
                    }
                    size="sm"
                  />
                  <Anchor component="button" size="sm" type="button">
                    Forgot password?
                  </Anchor>
                </Group>

                <Button
                  fullWidth
                  leftSection={<IconLogin2 size={16} />}
                  type="submit"
                >
                  Sign in
                </Button>
              </Stack>
            </form>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
