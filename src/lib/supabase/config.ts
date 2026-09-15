export interface BackendEnvironment {
  VITE_DATA_BACKEND?: string;
  VITE_TRACKER_SUPABASE_URL?: string;
  VITE_TRACKER_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}
export function readBackendConfig(env: BackendEnvironment) {
  const backend = env.VITE_DATA_BACKEND?.trim() || "local";
  if (backend === "local") return { backend } as const;
  if (backend !== "supabase")
    throw new Error("VITE_DATA_BACKEND must be local or supabase.");
  const url = (env.VITE_TRACKER_SUPABASE_URL ?? env.VITE_SUPABASE_URL)?.trim();
  const key = (
    env.VITE_TRACKER_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
  if (!url || !key)
    throw new Error(
      "Supabase mode requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" &&
    !(
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
    )
  ) {
    throw new Error(
      "Use an HTTPS Supabase URL (HTTP is allowed only for local development).",
    );
  }
  if (!key.startsWith("sb_publishable_"))
    throw new Error(
      "Use a Supabase publishable key, never a secret or service_role key.",
    );
  return { backend, url, key } as const;
}
