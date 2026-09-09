import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";
import { mapProfile } from "../api/supabase/mappers";

export class AuthService {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data.session;
  }
  async signOut() {
    const { error } = await this.client.auth.signOut({ scope: "local" });
    if (error) throw error;
  }
  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }
  async getProfile(userId: string) {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return mapProfile(data);
  }
  onSessionChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return this.client.auth.onAuthStateChange(callback).data.subscription;
  }
}
