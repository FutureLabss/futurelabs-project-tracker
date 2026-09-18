import { MockLocalStorageApi } from "../api/mock/local-storage-adapter";
import { SupabaseTrackerApi } from "../api/supabase/supabase-tracker-api";
import { supabase, passwordClient } from "../lib/supabase/client";
import { createTrackerServices } from "./create-tracker-services";
export { createTrackerServices } from "./create-tracker-services";
export const {
  taskService,
  projectService,
  blockerService,
  peopleService,
  reportingService,
  demoService,
} = createTrackerServices(
  supabase ? new SupabaseTrackerApi(supabase) : new MockLocalStorageApi(),
);

import { AuthService } from "./auth-service";
export const authService = supabase
  ? new AuthService(supabase, passwordClient)
  : null;
