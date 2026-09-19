export type SharedProjectTask = {
  id: number;
  title: string;
  overview: string;

  teammate?: {
    name: string;
    initials: string;
  };

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
    | 'INSPECT (READ-ONLY)'
    | 'SUBMIT'
    | 'START';
};