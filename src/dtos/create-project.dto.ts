export interface CreateProjectDto {
  name: string;
  goal: string;
  startDate: string; // ISO YYYY-MM-DD
  targetDate: string; // ISO YYYY-MM-DD
  managerId: string | null;
  actorId: string;
}
