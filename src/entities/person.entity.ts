export type UserRole = "member" | "manager" | "admin";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: "active" | "inactive";
  avatarUrl?: string;
  title?: string;
}
