import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthService, TrackerSession } from "../../services/auth-service";

// Capture once and remove immediately, including failed exchanges. Never log it.
let callbackCode: string | null = null;
const isCallback = window.location.pathname === "/auth/callback";
if (isCallback) {
  const codes = new URLSearchParams(window.location.search).getAll("code");
  callbackCode = codes.length === 1 ? codes[0] : null;
  window.history.replaceState(null, "", "/auth/callback");
}
export function useSupabaseSession(auth: AuthService) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<TrackerSession | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    let currentUser: string | undefined;
    const update = (next: TrackerSession | null) => {
      if (!active) return;
      if (currentUser !== next?.user.id) queryClient.clear();
      currentUser = next?.user.id;
      if (next) setError(null);
      setSession(next);
      setPending(false);
    };
    const fail = (failure: unknown) => {
      if (!active) return;
      update(null);
      setError(
        failure instanceof Error
          ? failure
          : new Error("Sign-in failed. Return to the LMS."),
      );
    };
    const subscription = auth.onSessionChange((_event, next) => update(next));
    const initial = isCallback
      ? callbackCode
        ? auth.consumeCode(callbackCode)
        : Promise.reject(
            new Error(
              "Missing sign-in code. Return to the LMS and open Project Tracker again.",
            ),
          )
      : auth.getSession();
    void initial
      .then((next) => {
        if (!active) return;
        update(next);
        if (isCallback && next) window.history.replaceState(null, "", "/");
      })
      .catch(fail);
    // Recheck active membership/session on focus and periodically while open.
    const validate = () => {
      void auth.getSession().then(update).catch(fail);
    };
    const timer = window.setInterval(validate, 30000);
    window.addEventListener("focus", validate);
    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearInterval(timer);
      window.removeEventListener("focus", validate);
    };
  }, [auth, queryClient]);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      () => {
        void auth
          .getSession()
          .then(setSession)
          .catch((failure) => {
            setSession(null);
            queryClient.clear();
            setError(failure);
          });
      },
      Math.max(0, session.expires_at * 1000 - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [auth, session, queryClient]);
  return { session, pending, error };
}
