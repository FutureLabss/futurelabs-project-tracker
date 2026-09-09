import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { readBackendConfig } from "./config";

export const backendConfig = readBackendConfig(import.meta.env);
export const supabase =
  backendConfig.backend === "supabase"
    ? createClient<Database>(backendConfig.url, backendConfig.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
