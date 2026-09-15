import type { Database } from "./database.types";
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type BlockerRow = Database["public"]["Tables"]["blockers"]["Row"];
export type AvailabilityRow =
  Database["public"]["Tables"]["availability"]["Row"];
export type LedgerRow = Database["public"]["Tables"]["ledger_records"]["Row"];
