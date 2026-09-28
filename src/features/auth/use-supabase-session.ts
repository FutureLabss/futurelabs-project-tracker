import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthService, TrackerSession } from "../../services/auth-service";
import {
  getLastActiveTime,
  getTrackerToken,
  setLastActiveTime,
} from "../../lib/supabase/tracker-session";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity triggers logout
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // proactively refresh when 5 minutes or less remain

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

    const onUserActivity = () => {
      setLastActiveTime(Date.now());
    };

    const activityEvents = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ] as const;
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, onUserActivity, { passive: true });
    });

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

    // Recheck active membership/session periodically and on window focus.
    // If active and near expiration, proactively renew using background sliding window.
    const validate = async () => {
      const now = Date.now();
      const lastActive = getLastActiveTime();
      const isIdle = now - lastActive > IDLE_TIMEOUT_MS;

      if (!isIdle && typeof auth.refreshSession === "function") {
        try {
          const currentToken = getTrackerToken();
          if (currentToken) {
            const claims = JSON.parse(
              atob(
                currentToken
                  .split(".")[1]
                  .replace(/-/g, "+")
                  .replace(/_/g, "/"),
              ),
            );
            if (
              typeof claims.exp === "number" &&
              claims.exp * 1000 - now <= REFRESH_THRESHOLD_MS
            ) {
              const refreshed = await auth.refreshSession();
              if (refreshed && active) {
                update(refreshed);
                return;
              }
            }
          }
        } catch {
          // ignore parsing error and fall back to getSession()
        }
      }

      void auth.getSession().then(update).catch(fail);
    };

    const timer = window.setInterval(validate, 30_000);
    window.addEventListener("focus", validate);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearInterval(timer);
      window.removeEventListener("focus", validate);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, onUserActivity);
      });
    };
  }, [auth, queryClient]);

  // Handle scheduled sliding window renewal and expiration
  useEffect(() => {
    if (!session) return;
    const now = Date.now();
    const timeUntilExpiry = Math.max(0, session.expires_at * 1000 - now);
    const refreshLeadTime = Math.max(0, timeUntilExpiry - REFRESH_THRESHOLD_MS);

    // Proactive background sliding window refresh if active
    const refreshTimer = window.setTimeout(async () => {
      const lastActive = getLastActiveTime();
      if (Date.now() - lastActive <= IDLE_TIMEOUT_MS) {
        const refreshed = await auth.refreshSession();
        if (refreshed) {
          setSession(refreshed);
          return;
        }
      }
    }, refreshLeadTime);

    // Hard expiry timeout if user was idle or refresh was impossible
    const expiryTimer = window.setTimeout(() => {
      void auth
        .getSession()
        .then(setSession)
        .catch((failure) => {
          setSession(null);
          queryClient.clear();
          setError(failure);
        });
    }, timeUntilExpiry);

    return () => {
      window.clearTimeout(refreshTimer);
      window.clearTimeout(expiryTimer);
    };
  }, [auth, session, queryClient]);

  return { session, pending, error };
}
