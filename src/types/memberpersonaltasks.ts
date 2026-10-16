export type PersonalTask = {
  id: string;
  title: string;
  overview: string;
  project: string;
  projectId?: string;
  complexity:
    | 'LOW (1 PT)'
    | 'MID (2 PTS)'
    | 'HIGH (3 PTS)';
  dueDate: string;
  overdue?: boolean;
  status:
    | 'NOT STARTED'
    | 'IN PROGRESS'
    | 'BLOCKED'
    | 'SUBMITTED (REVIEW)'
    | 'ACCEPTED';
  accessMode:
    | 'SUBMIT'
    | 'START'
    | 'INSPECT (READ-ONLY)';
};



