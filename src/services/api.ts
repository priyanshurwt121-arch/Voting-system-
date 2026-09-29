import {
  AuthUser,
  Candidate,
  EventSettings,
  JudgeScore,
  ProjectorScreen,
  Role,
  ScoreValue,
} from '../types';

let authToken: string | null = sessionStorage.getItem('rw_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    sessionStorage.setItem('rw_token', token);
  } else {
    sessionStorage.removeItem('rw_token');
  }
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; role: Role; username: string; name: string; judgeId?: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    ),

  stageLogin: (stageKey: string) =>
    request<{ token: string; role: Role; username: string; name: string }>(
      '/api/auth/stage-login',
      {
        method: 'POST',
        body: JSON.stringify({ stageKey }),
      }
    ),

  getMe: () => request<AuthUser>('/api/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  // Settings
  getSettings: () => request<EventSettings>('/api/settings'),
  updateSettings: (settings: Partial<EventSettings>) =>
    request<EventSettings>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Participants & Nominations
  getParticipants: () => request<Candidate[]>('/api/participants'),
  addParticipant: (participant: Partial<Candidate>) =>
    request<Candidate>('/api/participants', {
      method: 'POST',
      body: JSON.stringify(participant),
    }),

  getNominations: () =>
    request<{
      boys: { slotNumber: number; candidate: Candidate | null }[];
      girls: { slotNumber: number; candidate: Candidate | null }[];
      isComplete: boolean;
    }>('/api/nominations'),

  assignNominationSlot: (gender: 'BOY' | 'GIRL', slotIndex: number, candidateId: string | null) =>
    request<{ success: boolean; boyNominationSlots: (string | null)[]; girlNominationSlots: (string | null)[] }>(
      '/api/admin/nominations/slot',
      {
        method: 'POST',
        body: JSON.stringify({ gender, slotIndex, candidateId }),
      }
    ),

  // Photos (ADMIN ONLY)
  uploadCandidatePhoto: (id: string, photoUrl: string) =>
    request<{ success: boolean; photoUrl: string }>(`/api/admin/candidates/${id}/photo`, {
      method: 'POST',
      body: JSON.stringify({ photoUrl }),
    }),

  deleteCandidatePhoto: (id: string) =>
    request<{ success: boolean }>(`/api/admin/candidates/${id}/photo`, {
      method: 'DELETE',
    }),

  // Round 2 Talent Round
  getRound2Candidates: () =>
    request<{ boys: Candidate[]; girls: Candidate[]; total: number }>('/api/round2/candidates'),

  getScores: () => request<Record<string, JudgeScore>>('/api/judge/scores'),

  submitScore: (studentId: string, score: ScoreValue) =>
    request<{ success: boolean; scoreRecord: JudgeScore }>('/api/judge/score', {
      method: 'POST',
      body: JSON.stringify({ studentId, score }),
    }),

  lockRound2: (locked: boolean) =>
    request<{ success: boolean; round2Locked: boolean }>('/api/admin/round2/lock', {
      method: 'POST',
      body: JSON.stringify({ locked }),
    }),

  // Points Table & Elimination
  getPointsTable: () =>
    request<{
      boys: { rank: number; candidate: Candidate; j1: number | null; j2: number | null; j3: number | null; j4: number | null; total: number; isComplete: boolean; isEliminated: boolean }[];
      girls: { rank: number; candidate: Candidate; j1: number | null; j2: number | null; j3: number | null; j4: number | null; total: number; isComplete: boolean; isEliminated: boolean }[];
    }>('/api/points-table'),

  autoCalculateElimination: () =>
    request<{
      boyCandidatesToEliminate: string[];
      girlCandidatesToEliminate: string[];
      boysTable: any[];
      girlsTable: any[];
    }>('/api/admin/elimination/auto-calculate', {
      method: 'POST',
    }),

  confirmElimination: (boyEliminatedIds: string[], girlEliminatedIds: string[]) =>
    request<{ success: boolean; eliminatedStudentIds: string[] }>('/api/admin/elimination/confirm', {
      method: 'POST',
      body: JSON.stringify({ boyEliminatedIds, girlEliminatedIds }),
    }),

  getFinalists: () =>
    request<{ boys: Candidate[]; girls: Candidate[]; total: number }>('/api/finalists'),

  // Final Voting
  getVoteConfig: () =>
    request<{
      votingStatus: string;
      votingInstructions: string;
      eventName: string;
      collegeName: string;
      allowedBranches: string[];
      boys: Candidate[];
      girls: Candidate[];
    }>('/api/vote/config'),

  setVotingStatus: (status: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'LOCKED') =>
    request<{ success: boolean; votingStatus: string }>('/api/admin/vote/status', {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  submitVote: (payload: {
    name: string;
    branch: string;
    boyStudentId: string;
    girlStudentId: string;
    deviceFingerprint: string;
  }) =>
    request<{ success: boolean; message: string; voteId: string }>('/api/vote/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminVotes: () =>
    request<{
      totalVotes: number;
      boyVotes: Record<string, number>;
      girlVotes: Record<string, number>;
      votes: any[];
    }>('/api/admin/votes'),

  // Results & Titles
  getResults: () =>
    request<{
      boysResults: any;
      girlsResults: any;
      totalVotes: number;
      finalResultsLocked: boolean;
    }>('/api/results'),

  lockResults: (locked: boolean) =>
    request<{ success: boolean; finalResultsLocked: boolean }>('/api/admin/results/lock', {
      method: 'POST',
      body: JSON.stringify({ locked }),
    }),

  // Projector Stage
  getProjectorState: (source?: string) =>
    request<{
      activeScreen: ProjectorScreen;
      stageConnected: boolean;
      settings: any;
      data: any;
    }>(`/api/projector/state${source ? `?source=${source}` : ''}`),

  pingStage: () =>
    request<{ success: boolean; timestamp: number }>('/api/stage/ping', {
      method: 'POST',
    }),

  getStageStatus: () =>
    request<{ connected: boolean; lastPing: number; activeScreen: string }>('/api/stage/status'),

  setProjectorScreen: (screen: ProjectorScreen) =>
    request<{ success: boolean; activeScreen: ProjectorScreen }>('/api/admin/projector/screen', {
      method: 'POST',
      body: JSON.stringify({ screen }),
    }),

  getJudgeAccounts: () =>
    request<{ judgeId: string; name: string; username: string }[]>('/api/admin/judge-accounts'),

  // Audit Logs
  getAuditLogs: () => request<{ timestamp: string; action: string; user: string }[]>('/api/admin/audit-logs'),
};
