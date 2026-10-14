import { UserRole } from "../entities/person.entity";

export interface CreatePersonDto {
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  status?: "active" | "inactive";
  actorId: string;
}
