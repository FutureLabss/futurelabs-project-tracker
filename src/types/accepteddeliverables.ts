export type AcceptedDeliverable = {
  id: number;
  deliverable: string;
  project: string;
  projectId?: string;
  complexity:
    | 'LOW (1 PT)'
    | 'MID (2 PTS)'
    | 'HIGH (3 PTS)';
  acceptedOn: string;
};
