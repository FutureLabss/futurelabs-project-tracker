import { MockLocalStorageApi } from "../api/mock/local-storage-adapter";
import { SupabaseTrackerApi } from "../api/supabase/supabase-tracker-api";
import { supabase } from "../lib/supabase/client";
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
