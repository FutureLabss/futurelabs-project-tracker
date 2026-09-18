export interface RecordLeaveDto {
  personId: string;
  fromDate: string; // ISO YYYY-MM-DD
  toDate: string; // ISO YYYY-MM-DD
  note: string;
  actorId: string;
}
