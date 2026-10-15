import { UserRole } from "../entities/person.entity";

export interface UpdatePersonProfileDto {
  personId: string;
  name?: string;
  title?: string;
  avatarUrl?: string;
  actorId: string;
}

export interface ChangePersonRoleDto {
  personId: string;
  role: UserRole;
  actorId: string;
}

export interface SetPersonStatusDto {
  personId: string;
  status: "active" | "inactive";
  actorId: string;
}

export interface RevokePersonSessionsDto {
  personId: string;
  actorId: string;
}
