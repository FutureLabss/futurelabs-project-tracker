/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_LMS_APP_URL?: string;
  readonly VITE_TRACKER_SUPABASE_URL?: string;
  readonly VITE_TRACKER_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_DATA_BACKEND?: "local" | "supabase";
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}
