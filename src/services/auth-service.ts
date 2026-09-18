import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";
import { mapProfile } from "../api/supabase/mappers";
import {
  getTrackerToken,
  setTrackerToken,
} from "../lib/supabase/tracker-session";

export interface TrackerSession {
  user: { id: string };
  expires_at: number;
}
export class AuthService {
  private listeners = new Set<
    (event: string, session: TrackerSession | null) => void
  >();
  private exchange: Promise<TrackerSession> | null = null;
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly passwordClient?: SupabaseClient<Database> | null,
  ) {}
  private notify(session: TrackerSession | null) {
    this.listeners.forEach((callback) => callback("SESSION_CHANGED", session));
  }
  async signInWithPassword(email: string, password: string) {
    const passwordClient = this.passwordClient;
    if (!passwordClient) throw new Error("Supabase is not configured.");
    const { data, error } = await passwordClient.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    try {
      return await this.exchangeProof({
        access_token: data.session.access_token,
      });
    } finally {
      await passwordClient.auth.signOut({ scope: "local" });
    }
  }
  async consumeCode(code: string) {
    // Share the single-use exchange across StrictMode effect replays.
    if (!this.exchange) this.exchange = this.exchangeProof({ code });
    return this.exchange;
  }
  private async exchangeProof(
    body: { code: string } | { access_token: string },
  ) {
    setTrackerToken(null);
    const { data, error } = await this.client.functions.invoke(
      "consume-project-tracker-sso",
      { body },
    );
    if (error) {
      const response = "context" in error ? error.context : null;
      if (response instanceof Response) {
        const body = await response.json().catch(() => null);
        if (typeof body?.error === "string") throw new Error(body.error);
      }
      throw new Error(
        "Could not contact the sign-in service. Please try again.",
      );
    }
    if (typeof data?.token !== "string")
      throw new Error("Invalid sign-in response.");
    setTrackerToken(data.token);
    try {
      const session = await this.getSession();
      if (!session) throw new Error("Could not validate your Tracker session.");
      this.notify(session);
      return session;
    } catch (error) {
      setTrackerToken(null);
      throw error;
    }
  }
  async signOut() {
    try {
      const { error } = await this.client.rpc("tracker_logout");
      if (error)
        throw new Error(
          "Local session cleared, but server logout could not be confirmed. The session expires within 15 minutes.",
        );
    } finally {
      setTrackerToken(null);
      this.notify(null);
    }
  }
  async getSession(): Promise<TrackerSession | null> {
    const token = getTrackerToken();
    if (!token) return null;
    try {
      // Decoding only selects the profile; database RLS verifies signed identity,
      // session ID, expiration and active membership before returning any data.
      const claims = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (
        typeof claims.sub !== "string" ||
        typeof claims.exp !== "number" ||
        claims.exp * 1000 <= Date.now()
      )
        throw new Error();
      await this.getProfile(claims.sub);
      if (getTrackerToken() !== token) return null;
      return { user: { id: claims.sub }, expires_at: claims.exp };
    } catch {
      if (getTrackerToken() !== token) return null;
      setTrackerToken(null);
      this.notify(null);
      throw new Error(
        "Your Tracker session expired or access was revoked. Please sign in again.",
      );
    }
  }
  async getProfile(userId: string) {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw new Error("Could not validate Tracker membership.");
    return mapProfile(data);
  }
  onSessionChange(
    callback: (event: string, session: TrackerSession | null) => void,
  ) {
    this.listeners.add(callback);
    return {
      unsubscribe: () => {
        this.listeners.delete(callback);
      },
    };
  }
}
