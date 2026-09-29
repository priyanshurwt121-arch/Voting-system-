export type Role = 'ADMIN' | 'JUDGE' | 'AUDIENCE' | 'PROJECTOR';

export type Branch =
  | 'CSE'
  | 'Civil Engineering / CE'
  | 'Electrical Engineering / EE'
  | 'Mechanical Engineering'
  | 'BCA';

export const ALLOWED_BRANCHES: Branch[] = [
  'CSE',
  'Civil Engineering / CE',
  'Electrical Engineering / EE',
  'Mechanical Engineering',
  'BCA',
];

export interface Candidate {
  id: string; // Permanent student ID (e.g. "STU-B-101")
  name: string;
  gender: 'BOY' | 'GIRL';
  chestNumber: number;
  branch: Branch | string;
  photoUrl?: string;
  eliminated?: boolean;
}

export interface NominationSlot {
  slotNumber: number; // 1 to 8
  candidateId: string | null;
}

export type ScoreValue = 25 | 50 | 75 | 100;

export interface JudgeScore {
  judgeId: 'judge1' | 'judge2' | 'judge3' | 'judge4';
  studentId: string;
  score: ScoreValue;
  updatedAt: string;
}

export type ProjectorScreen =
  | 'IDLE'
  | 'BOYS_NOMINATIONS'
  | 'GIRLS_NOMINATIONS'
  | 'BOYS_POINTS_TABLE'
  | 'GIRLS_POINTS_TABLE'
  | 'BOYS_ELIMINATION'
  | 'GIRLS_ELIMINATION'
  | 'QR_VOTING'
  | 'FINAL_RESULTS'
  | 'TITLE_REVEAL';

export interface EventSettings {
  eventName: string;
  collegeName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventLogo: string;
  eventHeading: string;
  round1Name: string;
  round2Name: string;
  titles: {
    boy1: string;
    boy2: string;
    boy3: string;
    girl1: string;
    girl2: string;
    girl3: string;
  };
  stageText: string;
  votingInstructions: string;
  votingStatus: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'LOCKED';
  round2Locked: boolean;
  finalResultsLocked: boolean;
  stageKey: string;
}

export interface FinalVote {
  voteId: string;
  normalizedName: string;
  branch: string;
  deviceFingerprint: string;
  boyStudentId: string;
  girlStudentId: string;
  timestamp: string;
}

export interface PointsTableRow {
  rank: number;
  candidate: Candidate;
  j1: number | null;
  j2: number | null;
  j3: number | null;
  j4: number | null;
  total: number;
  isComplete: boolean;
}

export interface FinalResultCandidate {
  candidate: Candidate;
  votes: number;
  pointsScore: number;
  titleAwarded?: string;
}

export interface AuthUser {
  role: Role;
  username: string;
  judgeId?: 'judge1' | 'judge2' | 'judge3' | 'judge4';
  name: string;
}
