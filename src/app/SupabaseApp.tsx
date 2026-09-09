import dayjs from "dayjs";
import { useState } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { AuthService } from "../services/auth-service";
import { supabase } from "../lib/supabase/client";
import { SupabaseLoginScreen } from "../features/auth/SupabaseLoginScreen";
import { useSupabaseSession } from "../features/auth/use-supabase-session";
import { RoleDashboardLayout } from "../components/RoleDashboardLayout";
import { roleDashboards } from "../data/dashboard-layouts";

export function SupabaseApp() {
  const [auth] = useState(() => {
    if (!supabase) throw new Error("Supabase is not configured.");
    return new AuthService(supabase);
  });
  const { session, pending, error } = useSupabaseSession(auth);
  const [logoutError, setLogoutError] = useState("");
  const profile = useQuery({
    queryKey: ["auth-profile", session?.user.id],
    queryFn: () => auth.getProfile(session!.user.id),
    enabled: Boolean(session),
  });
  async function logout() {
    setLogoutError("");
    try {
      await auth.signOut();
    } catch (failure) {
      setLogoutError(
        failure instanceof Error ? failure.message : "Sign-out failed.",
      );
    }
  }
  if (pending)
    return (
      <Text p="lg" role="status">
        Restoring your session...
      </Text>
    );
  if (!session)
    return (
      <>
        <SupabaseLoginScreen auth={auth} />
        {error && <Alert color="red">{error.message}</Alert>}
      </>
    );
  if (profile.isError)
    return (
      <Stack p="lg">
        <Alert color="red" title="Could not load your account">
          {profile.error.message}
        </Alert>
        {logoutError && <Alert color="red">{logoutError}</Alert>}
        <Button onClick={() => void profile.refetch()}>Retry</Button>
        <Button variant="light" onClick={() => void logout()}>
          Sign out
        </Button>
      </Stack>
    );
  if (!profile.data)
    return (
      <Text p="lg" role="status">
        Loading your profile...
      </Text>
    );
  return (
    <>
      {logoutError && (
        <Alert color="red" role="alert">
          {logoutError}
        </Alert>
      )}
      <RoleDashboardLayout
        config={roleDashboards[profile.data.role]}
        personId={profile.data.id}
        personName={profile.data.name}
        initialDate={dayjs().format("YYYY-MM-DD")}
        onLogout={() => void logout()}
      />
    </>
  );
}
