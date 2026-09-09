import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthService } from "../../services/auth-service";

export function useSupabaseSession(auth: AuthService) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    let revision = 0;
    let userId: string | undefined;
    const update = (next: Session | null) => {
      if (!active) return;
      if (next?.user.id !== userId) queryClient.clear();
      userId = next?.user.id;
      setSession(next);
      setPending(false);
      setError(null);
    };
    const subscription = auth.onSessionChange((_event, next) => {
      revision++;
      update(next);
    });
    const initialRevision = revision;
    void auth
      .getSession()
      .then((next) => {
        if (revision === initialRevision) update(next);
      })
      .catch((failure) => {
        if (active && revision === initialRevision) {
          setError(
            failure instanceof Error
              ? failure
              : new Error("Could not restore your session."),
          );
          setPending(false);
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [auth, queryClient]);
  return { session, pending, error };
}
