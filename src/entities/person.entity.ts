export type UserRole = "member" | "manager" | "admin";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  title?: string;
}
