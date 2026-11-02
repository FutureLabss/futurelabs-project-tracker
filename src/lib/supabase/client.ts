import { getTrackerToken } from "./tracker-session";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { readBackendConfig } from "./config";

export const backendConfig = (() => {
  try {
    return readBackendConfig(import.meta.env);
  } catch {
    return { backend: "invalid" as const };
  }
})();
export const trackerClient =
  backendConfig.backend === "supabase"
    ? createClient<Database>(backendConfig.url, backendConfig.key, {
        accessToken: async () => getTrackerToken(),
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

// Compatibility alias for the established data service adapter.
export const supabase = trackerClient;

