export type PersonalTask = {
  id: number;
  title: string;
  overview: string;
  project: string;
  complexity:
    | 'LOW (1 PT)'
    | 'MID (2 PTS)'
    | 'HIGH (3 PTS)';
  dueDate: string;
  overdue?: boolean;
  status:
    | 'NOT STARTED'
    | 'IN PROGRESS'
    | 'BLOCKED';
  accessMode:
    | 'SUBMIT'
    | 'START'
    | 'INSPECT (READ-ONLY)';
};



