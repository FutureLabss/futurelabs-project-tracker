export interface RescheduleTaskDto {
  taskId: string;
  newDueDate: string; // ISO YYYY-MM-DD
  reason: string; // Mandatory justification
  actorId: string;
}
