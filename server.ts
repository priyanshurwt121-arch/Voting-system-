import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  Candidate,
  EventSettings,
  JudgeScore,
  FinalVote,
  ProjectorScreen,
  Role,
  ALLOWED_BRANCHES,
  ScoreValue,
} from './src/types/index.ts';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'ramp-walk-2026.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fixed accounts as per security specification
const USERS = {
  admin: {
    password: 'admin@07',
    role: 'ADMIN' as Role,
    name: 'Event Administrator',
  },
  judge1: {
    password: 'judge@1',
    role: 'JUDGE' as Role,
    judgeId: 'judge1' as const,
    name: 'Judge 1',
  },
  judge2: {
    password: 'judge@2',
    role: 'JUDGE' as Role,
    judgeId: 'judge2' as const,
    name: 'Judge 2',
  },
  judge3: {
    password: 'judge@3',
    role: 'JUDGE' as Role,
    judgeId: 'judge3' as const,
    name: 'Judge 3',
  },
  judge4: {
    password: 'judge@4',
    role: 'JUDGE' as Role,
    judgeId: 'judge4' as const,
    name: 'Judge 4',
  },
};

interface Session {
  token: string;
  role: Role;
  username: string;
  name: string;
  judgeId?: 'judge1' | 'judge2' | 'judge3' | 'judge4';
  createdAt: number;
}

// In-memory active sessions map
const sessions = new Map<string, Session>();

// Initial Participants Data
const DEFAULT_BOYS: Candidate[] = [
  { id: 'STU-B-101', name: 'Rahul Sharma', gender: 'BOY', chestNumber: 11, branch: 'Computer Science Engineering' },
  { id: 'STU-B-102', name: 'Aman Verma', gender: 'BOY', chestNumber: 14, branch: 'CSE' },
  { id: 'STU-B-103', name: 'Rohit Deshmukh', gender: 'BOY', chestNumber: 17, branch: 'Mechanical Engineering' },
  { id: 'STU-B-104', name: 'Kabir Malhotra', gender: 'BOY', chestNumber: 21, branch: 'Civil Engineering' },
  { id: 'STU-B-105', name: 'Devendra Patel', gender: 'BOY', chestNumber: 24, branch: 'Electrical Engineering' },
  { id: 'STU-B-106', name: 'Arjun Singhania', gender: 'BOY', chestNumber: 29, branch: 'BCA' },
  { id: 'STU-B-107', name: 'Vikramaditya Roy', gender: 'BOY', chestNumber: 33, branch: 'CSE' },
  { id: 'STU-B-108', name: 'Siddharth Nair', gender: 'BOY', chestNumber: 38, branch: 'Computer Science Engineering' },
  { id: 'STU-B-109', name: 'Yash Vardhan', gender: 'BOY', chestNumber: 42, branch: 'EE' },
  { id: 'STU-B-110', name: 'Manish Rawat', gender: 'BOY', chestNumber: 45, branch: 'CE' },
  { id: 'STU-B-111', name: 'Kunal Kapoor', gender: 'BOY', chestNumber: 49, branch: 'Mechanical Engineering' },
  { id: 'STU-B-112', name: 'Farhan Zaidi', gender: 'BOY', chestNumber: 52, branch: 'BCA' },
];

const DEFAULT_GIRLS: Candidate[] = [
  { id: 'STU-G-201', name: 'Ananya Iyer', gender: 'GIRL', chestNumber: 12, branch: 'Computer Science Engineering' },
  { id: 'STU-G-202', name: 'Pooja Hegde', gender: 'GIRL', chestNumber: 15, branch: 'CSE' },
  { id: 'STU-G-203', name: 'Riya Sen', gender: 'GIRL', chestNumber: 18, branch: 'Electrical Engineering' },
  { id: 'STU-G-204', name: 'Tanvi Senapati', gender: 'GIRL', chestNumber: 22, branch: 'BCA' },
  { id: 'STU-G-205', name: 'Meera Chawla', gender: 'GIRL', chestNumber: 25, branch: 'Civil Engineering' },
  { id: 'STU-G-206', name: 'Sneha Kulkarni', gender: 'GIRL', chestNumber: 30, branch: 'Mechanical Engineering' },
  { id: 'STU-G-207', name: 'Diya Rastogi', gender: 'GIRL', chestNumber: 34, branch: 'CSE' },
  { id: 'STU-G-208', name: 'Ishita Bhattacharya', gender: 'GIRL', chestNumber: 39, branch: 'Computer Science Engineering' },
  { id: 'STU-G-209', name: 'Kavya Pillai', gender: 'GIRL', chestNumber: 43, branch: 'CE' },
  { id: 'STU-G-210', name: 'Zoya Khan', gender: 'GIRL', chestNumber: 47, branch: 'EE' },
  { id: 'STU-G-211', name: 'Simran Walia', gender: 'GIRL', chestNumber: 51, branch: 'Mechanical Engineering' },
  { id: 'STU-G-212', name: 'Nandini Joshi', gender: 'GIRL', chestNumber: 55, branch: 'BCA' },
];

interface AppState {
  settings: EventSettings;
  participants: Candidate[];
  // 8 slots for boys, 8 slots for girls (candidate id or null)
  boyNominationSlots: (string | null)[];
  girlNominationSlots: (string | null)[];
  round1Finalized: boolean;
  round2Scores: Record<string, JudgeScore>; // key: `${judgeId}_${studentId}`
  eliminatedStudentIds: string[];
  round2TieResolutions: Record<string, string>;
  titleTieResolutions: Record<string, string>;
  votes: FinalVote[];
  usedDevices: string[];
  usedIdentities: string[];
  projectorScreen: ProjectorScreen;
  auditLogs: { timestamp: string; action: string; user: string }[];
}

function getDefaultState(): AppState {
  // Pre-seed top 8 boys and top 8 girls as initial nominees so system is immediately testable and workable!
  const boySlots = DEFAULT_BOYS.slice(0, 8).map((b) => b.id);
  const girlSlots = DEFAULT_GIRLS.slice(0, 8).map((g) => g.id);

  return {
    settings: {
      eventName: 'Ramp Walk 2026',
      collegeName: 'Apex Institute of Engineering & Technology',
      eventDate: 'October 15, 2026',
      eventTime: '06:00 PM onwards',
      eventLocation: 'Grand Auditorium, Main Campus',
      eventLogo: '',
      eventHeading: 'Annual Cultural Fest & Fashion Extravaganza',
      round1Name: 'Round 1: The Ramp Walk',
      round2Name: 'Round 2: The Talent Round',
      titles: {
        boy1: 'Mr. Fresher',
        boy2: 'Mr. Handsome',
        boy3: 'Mr. Perfect',
        girl1: 'Miss Fresher',
        girl2: 'Miss Beautiful',
        girl3: 'Miss Perfect',
      },
      stageText: 'Welcome to Ramp Walk 2026 — Glamour, Poise & Talent',
      votingInstructions: 'Vote for exactly 1 Boy and 1 Girl. One vote per device.',
      votingStatus: 'NOT_STARTED',
      round2Locked: false,
      finalResultsLocked: false,
      stageKey: 'stage2026',
    },
    participants: [...DEFAULT_BOYS, ...DEFAULT_GIRLS],
    boyNominationSlots: boySlots,
    girlNominationSlots: girlSlots,
    round1Finalized: true,
    round2Scores: {},
    eliminatedStudentIds: [],
    round2TieResolutions: {},
    titleTieResolutions: {},
    votes: [],
    usedDevices: [],
    usedIdentities: [],
    projectorScreen: 'IDLE',
    auditLogs: [
      {
        timestamp: new Date().toISOString(),
        action: 'System initialized with Ramp Walk 2026 standard configuration',
        user: 'System',
      },
    ],
  };
}

let state: AppState = (() => {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return parsed;
    } catch {
      return getDefaultState();
    }
  }
  return getDefaultState();
})();

function persistState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist state:', err);
  }
}

function logAudit(action: string, user: string) {
  state.auditLogs.unshift({
    timestamp: new Date().toISOString(),
    action,
    user,
  });
  if (state.auditLogs.length > 200) {
    state.auditLogs = state.auditLogs.slice(0, 200);
  }
  persistState();
}

// Setup Express
const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Auth Middleware
interface AuthRequest extends Request {
  user?: Session;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = sessions.get(token);
    if (session) {
      req.user = session;
    }
  }
  next();
}

app.use(authMiddleware);

function requireRole(roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Access Denied: You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const cleanUser = String(username).trim();
  const user = USERS[cleanUser as keyof typeof USERS];

  if (!user || user.password !== password) {
    res.status(401).json({ error: 'ACCESS_DENIED', message: 'Invalid credentials. Access denied.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const session: Session = {
    token,
    role: user.role,
    username: cleanUser,
    name: user.name,
    judgeId: 'judgeId' in user ? user.judgeId : undefined,
    createdAt: Date.now(),
  };

  sessions.set(token, session);
  logAudit(`Successful login for user '${cleanUser}' with role '${user.role}'`, cleanUser);

  res.json({
    token,
    role: user.role,
    username: cleanUser,
    name: user.name,
    judgeId: session.judgeId,
  });
});

app.post('/api/auth/stage-login', (req: Request, res: Response) => {
  const { stageKey } = req.body;
  if (!stageKey || stageKey !== state.settings.stageKey) {
    res.status(401).json({ error: 'ACCESS_DENIED', message: 'Invalid Projector Stage Key. Access denied.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const session: Session = {
    token,
    role: 'PROJECTOR',
    username: 'projector_stage',
    name: 'Stage Display Console',
    createdAt: Date.now(),
  };

  sessions.set(token, session);
  logAudit('Stage projector display authenticated', 'Projector');

  res.json({
    token,
    role: 'PROJECTOR',
    username: 'projector_stage',
    name: 'Stage Display Console',
  });
});

app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'UNAUTHENTICATED', message: 'No active session' });
    return;
  }
  res.json({
    role: req.user.role,
    username: req.user.username,
    name: req.user.name,
    judgeId: req.user.judgeId,
  });
});

app.post('/api/auth/logout', (req: AuthRequest, res: Response) => {
  if (req.user) {
    sessions.delete(req.user.token);
    logAudit(`User '${req.user.username}' logged out`, req.user.username);
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// Settings Endpoints
// -------------------------------------------------------------
app.get('/api/settings', (req: Request, res: Response) => {
  // Public settings (hide secret stageKey if not Admin)
  res.json({
    eventName: state.settings.eventName,
    collegeName: state.settings.collegeName,
    eventDate: state.settings.eventDate,
    eventTime: state.settings.eventTime,
    eventLocation: state.settings.eventLocation,
    eventLogo: state.settings.eventLogo,
    eventHeading: state.settings.eventHeading,
    round1Name: state.settings.round1Name,
    round2Name: state.settings.round2Name,
    titles: state.settings.titles,
    stageText: state.settings.stageText,
    votingInstructions: state.settings.votingInstructions,
    votingStatus: state.settings.votingStatus,
    round2Locked: state.settings.round2Locked,
    finalResultsLocked: state.settings.finalResultsLocked,
  });
});

app.get('/api/admin/settings', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  res.json(state.settings);
});

app.put('/api/admin/settings', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    res.status(400).json({ error: 'Invalid settings body' });
    return;
  }

  state.settings = {
    ...state.settings,
    ...updates,
    titles: {
      ...state.settings.titles,
      ...(updates.titles || {}),
    },
  };
  persistState();
  logAudit('Admin updated event presentation settings', req.user!.username);
  res.json(state.settings);
});

// -------------------------------------------------------------
// Participant Management (Round 1 & Nominees)
// -------------------------------------------------------------
app.get('/api/participants', requireRole(['ADMIN']), (req: Request, res: Response) => {
  res.json(state.participants);
});

app.post('/api/participants', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { name, gender, chestNumber, branch, photoUrl } = req.body;
  if (!name || !gender || !chestNumber || !branch) {
    res.status(400).json({ error: 'Missing required participant fields' });
    return;
  }

  const prefix = gender === 'BOY' ? 'STU-B' : 'STU-G';
  const id = `${prefix}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

  const newCandidate: Candidate = {
    id,
    name: String(name).trim(),
    gender: gender === 'BOY' ? 'BOY' : 'GIRL',
    chestNumber: Number(chestNumber),
    branch: String(branch).trim(),
    photoUrl: photoUrl || '',
  };

  state.participants.push(newCandidate);
  persistState();
  logAudit(`Admin added participant '${newCandidate.name}' (Chest ${newCandidate.chestNumber})`, req.user!.username);
  res.json(newCandidate);
});

// Get Current 8 Boy + 8 Girl Nominee Slots
app.get('/api/nominations', (req: Request, res: Response) => {
  const candidateMap = new Map<string, Candidate>(state.participants.map((p) => [p.id, p]));

  const boys = state.boyNominationSlots.map((id, index) => ({
    slotNumber: index + 1,
    candidate: id ? candidateMap.get(id) || null : null,
  }));

  const girls = state.girlNominationSlots.map((id, index) => ({
    slotNumber: index + 1,
    candidate: id ? candidateMap.get(id) || null : null,
  }));

  res.json({
    boys,
    girls,
    isComplete:
      boys.every((b) => b.candidate !== null) &&
      girls.every((g) => g.candidate !== null),
  });
});

// Admin assign participant to a slot
app.post('/api/admin/nominations/slot', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { gender, slotIndex, candidateId } = req.body;
  if (gender !== 'BOY' && gender !== 'GIRL') {
    res.status(400).json({ error: 'Gender must be BOY or GIRL' });
    return;
  }
  if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex > 7) {
    res.status(400).json({ error: 'Slot index must be between 0 and 7' });
    return;
  }

  const slots = gender === 'BOY' ? state.boyNominationSlots : state.girlNominationSlots;

  if (candidateId) {
    // Validate candidate exists and matches gender
    const candidate = state.participants.find((p) => p.id === candidateId);
    if (!candidate) {
      res.status(404).json({ error: 'Participant not found' });
      return;
    }
    if (candidate.gender !== gender) {
      res.status(400).json({ error: `Participant gender does not match ${gender}` });
      return;
    }
    // Check if candidate already assigned to another slot in this gender
    const existingIndex = slots.findIndex((id, idx) => id === candidateId && idx !== slotIndex);
    if (existingIndex !== -1) {
      slots[existingIndex] = null; // Move from previous slot
    }
    slots[slotIndex] = candidateId;
  } else {
    slots[slotIndex] = null;
  }

  persistState();
  logAudit(`Admin updated ${gender} nomination slot ${slotIndex + 1}`, req.user!.username);
  res.json({ success: true, boyNominationSlots: state.boyNominationSlots, girlNominationSlots: state.girlNominationSlots });
});

// -------------------------------------------------------------
// Photo Management (ADMIN ONLY)
// -------------------------------------------------------------
app.post('/api/admin/candidates/:id/photo', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { photoUrl } = req.body;

  if (!photoUrl || typeof photoUrl !== 'string') {
    res.status(400).json({ error: 'Invalid photo data' });
    return;
  }

  const candidate = state.participants.find((p) => p.id === id);
  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  candidate.photoUrl = photoUrl;
  persistState();
  logAudit(`Admin updated photo for candidate ${candidate.name} (${candidate.id})`, req.user!.username);
  res.json({ success: true, photoUrl: candidate.photoUrl });
});

app.delete('/api/admin/candidates/:id/photo', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const candidate = state.participants.find((p) => p.id === id);
  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  candidate.photoUrl = '';
  persistState();
  logAudit(`Admin removed photo for candidate ${candidate.name} (${candidate.id})`, req.user!.username);
  res.json({ success: true });
});

// Helper: Get Official 16 Nominees
function getOfficial16Nominees(): { boys: Candidate[]; girls: Candidate[] } {
  const candidateMap = new Map<string, Candidate>(state.participants.map((p) => [p.id, p]));
  const boys: Candidate[] = [];
  const girls: Candidate[] = [];

  for (const id of state.boyNominationSlots) {
    if (id && candidateMap.has(id)) {
      boys.push(candidateMap.get(id)!);
    }
  }

  for (const id of state.girlNominationSlots) {
    if (id && candidateMap.has(id)) {
      girls.push(candidateMap.get(id)!);
    }
  }

  return { boys, girls };
}

// -------------------------------------------------------------
// Round 2 Talent Round & Scoring
// -------------------------------------------------------------
app.get('/api/round2/candidates', (req: Request, res: Response) => {
  const { boys, girls } = getOfficial16Nominees();
  res.json({ boys, girls, total: boys.length + girls.length });
});

app.get('/api/judge/scores', requireRole(['JUDGE', 'ADMIN']), (req: AuthRequest, res: Response) => {
  // If judge, can view scores (or admin can view all scores)
  res.json(state.round2Scores);
});

app.post('/api/judge/score', requireRole(['JUDGE']), (req: AuthRequest, res: Response) => {
  if (state.settings.round2Locked) {
    res.status(403).json({
      error: 'ROUND_LOCKED',
      message: 'Round 2 has been locked by Admin. Scores can no longer be modified.',
    });
    return;
  }

  const { studentId, score } = req.body;
  const judgeId = req.user!.judgeId;

  if (!judgeId || !['judge1', 'judge2', 'judge3', 'judge4'].includes(judgeId)) {
    res.status(403).json({ error: 'Invalid judge identity' });
    return;
  }

  // Strict score validation
  const numericScore = Number(score);
  if (![25, 50, 75, 100].includes(numericScore as ScoreValue)) {
    res.status(400).json({
      error: 'INVALID_SCORE',
      message: 'Score must be exactly 25, 50, 75, or 100.',
    });
    return;
  }

  // Ensure candidate is in the official 16 nominees
  const { boys, girls } = getOfficial16Nominees();
  const validNominee = [...boys, ...girls].some((c) => c.id === studentId);
  if (!validNominee) {
    res.status(404).json({ error: 'Candidate is not among the 16 nominated candidates' });
    return;
  }

  const key = `${judgeId}_${studentId}`;
  state.round2Scores[key] = {
    judgeId,
    studentId,
    score: numericScore as ScoreValue,
    updatedAt: new Date().toISOString(),
  };

  persistState();
  res.json({ success: true, scoreRecord: state.round2Scores[key] });
});

app.post('/api/admin/round2/lock', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { locked } = req.body;
  state.settings.round2Locked = Boolean(locked);
  persistState();
  logAudit(`Admin ${locked ? 'LOCKED' : 'UNLOCKED'} Round 2 scores`, req.user!.username);
  res.json({ success: true, round2Locked: state.settings.round2Locked });
});

// -------------------------------------------------------------
// Points Table Calculation
// -------------------------------------------------------------
function calculatePointsTable() {
  const { boys, girls } = getOfficial16Nominees();

  function buildTable(list: Candidate[]) {
    const rows = list.map((cand) => {
      const s1 = state.round2Scores[`judge1_${cand.id}`]?.score ?? null;
      const s2 = state.round2Scores[`judge2_${cand.id}`]?.score ?? null;
      const s3 = state.round2Scores[`judge3_${cand.id}`]?.score ?? null;
      const s4 = state.round2Scores[`judge4_${cand.id}`]?.score ?? null;
      const total = (s1 || 0) + (s2 || 0) + (s3 || 0) + (s4 || 0);
      const isComplete = s1 !== null && s2 !== null && s3 !== null && s4 !== null;

      return {
        candidate: cand,
        j1: s1,
        j2: s2,
        j3: s3,
        j4: s4,
        total,
        isComplete,
        isEliminated: state.eliminatedStudentIds.includes(cand.id),
      };
    });

    // Sort descending by total
    rows.sort((a, b) => b.total - a.total);

    return rows.map((r, idx) => ({
      rank: idx + 1,
      ...r,
    }));
  }

  return {
    boys: buildTable(boys),
    girls: buildTable(girls),
  };
}

app.get('/api/points-table', (req: Request, res: Response) => {
  res.json(calculatePointsTable());
});

// -------------------------------------------------------------
// Round 2 Elimination (Eliminate Bottom 2 Boys and 2 Girls)
// -------------------------------------------------------------
app.post('/api/admin/elimination/auto-calculate', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { boys, girls } = calculatePointsTable();

  // Bottom 2 boys
  const boyCandidatesToEliminate: string[] = [];
  const girlCandidatesToEliminate: string[] = [];

  // Identify bottom 2
  if (boys.length >= 8) {
    const bottomBoys = boys.slice(-2);
    // Check for tie between 6th, 7th, 8th
    const score6 = boys[5]?.total ?? -1;
    const score7 = boys[6]?.total ?? -1;
    const hasTie = score6 === score7;

    if (!hasTie) {
      bottomBoys.forEach((b) => boyCandidatesToEliminate.push(b.candidate.id));
    }
  }

  if (girls.length >= 8) {
    const bottomGirls = girls.slice(-2);
    const score6 = girls[5]?.total ?? -1;
    const score7 = girls[6]?.total ?? -1;
    const hasTie = score6 === score7;

    if (!hasTie) {
      bottomGirls.forEach((g) => girlCandidatesToEliminate.push(g.candidate.id));
    }
  }

  res.json({
    boyCandidatesToEliminate,
    girlCandidatesToEliminate,
    boysTable: boys,
    girlsTable: girls,
  });
});

app.post('/api/admin/elimination/confirm', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { boyEliminatedIds, girlEliminatedIds } = req.body;

  if (
    !Array.isArray(boyEliminatedIds) ||
    boyEliminatedIds.length !== 2 ||
    !Array.isArray(girlEliminatedIds) ||
    girlEliminatedIds.length !== 2
  ) {
    res.status(400).json({
      error: 'Exactly 2 boys and 2 girls must be eliminated to leave 12 finalists.',
    });
    return;
  }

  state.eliminatedStudentIds = [...boyEliminatedIds, ...girlEliminatedIds];
  persistState();
  logAudit(`Admin confirmed Round 2 elimination of 4 candidates`, req.user!.username);
  res.json({ success: true, eliminatedStudentIds: state.eliminatedStudentIds });
});

// Finalists (6 Boys + 6 Girls = 12 Candidates)
function getFinalists() {
  const { boys, girls } = getOfficial16Nominees();
  const finalistBoys = boys.filter((b) => !state.eliminatedStudentIds.includes(b.id));
  const finalistGirls = girls.filter((g) => !state.eliminatedStudentIds.includes(g.id));

  return {
    boys: finalistBoys,
    girls: finalistGirls,
    total: finalistBoys.length + finalistGirls.length,
  };
}

app.get('/api/finalists', (req: Request, res: Response) => {
  res.json(getFinalists());
});

// -------------------------------------------------------------
// Final Voting (Audience & All Attendees)
// -------------------------------------------------------------
app.get('/api/vote/config', (req: Request, res: Response) => {
  const { boys, girls } = getFinalists();
  res.json({
    votingStatus: state.settings.votingStatus,
    votingInstructions: state.settings.votingInstructions,
    eventName: state.settings.eventName,
    collegeName: state.settings.collegeName,
    allowedBranches: ALLOWED_BRANCHES,
    boys,
    girls,
  });
});

app.post('/api/admin/vote/status', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['NOT_STARTED', 'ACTIVE', 'PAUSED', 'CLOSED', 'LOCKED'].includes(status)) {
    res.status(400).json({ error: 'Invalid voting status' });
    return;
  }

  state.settings.votingStatus = status;
  if (status === 'LOCKED') {
    state.settings.finalResultsLocked = true;
  }
  persistState();
  logAudit(`Admin changed final voting status to '${status}'`, req.user!.username);
  res.json({ success: true, votingStatus: state.settings.votingStatus });
});

// Submit Vote (Enforce One Device = One Vote, strict server verification)
app.post('/api/vote/submit', (req: Request, res: Response) => {
  if (state.settings.votingStatus !== 'ACTIVE') {
    res.status(403).json({
      error: 'VOTING_INACTIVE',
      message: 'Voting is currently closed or paused.',
    });
    return;
  }

  const name = req.body.name || req.body.fullName;
  const { branch, boyStudentId, girlStudentId, deviceFingerprint } = req.body;

  if (!name || !branch || !boyStudentId || !girlStudentId || !deviceFingerprint) {
    res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'All fields (Full Name, Branch, 1 Boy selection, 1 Girl selection) are required.',
    });
    return;
  }

  // Branch validation
  const cleanBranch = String(branch).trim();
  if (!ALLOWED_BRANCHES.includes(cleanBranch as any)) {
    res.status(400).json({
      error: 'INVALID_BRANCH',
      message: 'Branch must be selected from the approved branch list.',
    });
    return;
  }

  // Name normalization: trim, lowercase, collapse multiple spaces
  const normalizedName = String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (normalizedName.length < 2) {
    res.status(400).json({
      error: 'INVALID_NAME',
      message: 'Please provide a valid full name.',
    });
    return;
  }

  const identityKey = `${normalizedName}::${cleanBranch.toLowerCase()}`;
  const cleanDevice = String(deviceFingerprint).trim();

  // Server-side Device check
  if (state.usedDevices.includes(cleanDevice)) {
    res.status(403).json({
      error: 'ALREADY_VOTED',
      message: 'You have already voted. Multiple voting is not allowed.',
    });
    return;
  }

  // Server-side Name + Branch check
  if (state.usedIdentities.includes(identityKey)) {
    res.status(403).json({
      error: 'ALREADY_VOTED',
      message: 'A vote has already been submitted under this name and branch.',
    });
    return;
  }

  // Candidate validation: Exactly 1 boy and 1 girl from official finalists
  const { boys, girls } = getFinalists();
  const validBoy = boys.find((b) => b.id === boyStudentId);
  const validGirl = girls.find((g) => g.id === girlStudentId);

  if (!validBoy || !validGirl) {
    res.status(400).json({
      error: 'INVALID_CANDIDATE',
      message: 'Selected candidate must be an official finalist.',
    });
    return;
  }

  const voteId = crypto.randomUUID();
  const newVote: FinalVote = {
    voteId,
    normalizedName,
    branch: cleanBranch,
    deviceFingerprint: cleanDevice,
    boyStudentId,
    girlStudentId,
    timestamp: new Date().toISOString(),
  };

  state.votes.push(newVote);
  state.usedDevices.push(cleanDevice);
  state.usedIdentities.push(identityKey);
  persistState();

  res.json({
    success: true,
    message: 'Vote submitted successfully! Thank you for participating.',
    voteId,
  });
});

app.get('/api/admin/votes', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  // Aggregate votes
  const boyVotes: Record<string, number> = {};
  const girlVotes: Record<string, number> = {};

  for (const v of state.votes) {
    boyVotes[v.boyStudentId] = (boyVotes[v.boyStudentId] || 0) + 1;
    girlVotes[v.girlStudentId] = (girlVotes[v.girlStudentId] || 0) + 1;
  }

  res.json({
    totalVotes: state.votes.length,
    boyVotes,
    girlVotes,
    votes: state.votes,
  });
});

// -------------------------------------------------------------
// Final Results & Title Allocation Calculation
// -------------------------------------------------------------
function calculateResultsAndTitles() {
  const { boys: finalistBoys, girls: finalistGirls } = getFinalists();
  const pointsTable = calculatePointsTable();

  // Tally votes
  const boyVotesCount: Record<string, number> = {};
  const girlVotesCount: Record<string, number> = {};
  for (const v of state.votes) {
    boyVotesCount[v.boyStudentId] = (boyVotesCount[v.boyStudentId] || 0) + 1;
    girlVotesCount[v.girlStudentId] = (girlVotesCount[v.girlStudentId] || 0) + 1;
  }

  function resolveTitles(
    finalists: Candidate[],
    votesCount: Record<string, number>,
    pointsRows: any[],
    titles: { t1: string; t2: string; t3: string },
    genderPrefix: 'boy' | 'girl'
  ) {
    // 1. Sort finalists by votes descending
    const sortedByVotes = [...finalists].map((c) => ({
      candidate: c,
      votes: votesCount[c.id] || 0,
      pointsTotal: pointsRows.find((p) => p.candidate.id === c.id)?.total || 0,
    }));

    sortedByVotes.sort((a, b) => b.votes - a.votes);

    // Winner of Title 1 (Mr. / Miss Fresher)
    const winner1 = sortedByVotes[0];

    // Check for voting tie at 1st place
    const isVoteTie = sortedByVotes.length > 1 && sortedByVotes[0].votes > 0 && sortedByVotes[0].votes === sortedByVotes[1].votes;

    // 2. Remaining finalists for Title 2 & Title 3 come from Round 2 Points Table
    const remainingFinalists = finalists.filter((c) => c.id !== winner1?.candidate.id);
    const sortedByPoints = remainingFinalists
      .map((c) => ({
        candidate: c,
        votes: votesCount[c.id] || 0,
        pointsTotal: pointsRows.find((p) => p.candidate.id === c.id)?.total || 0,
      }))
      .sort((a, b) => b.pointsTotal - a.pointsTotal);

    const winner2 = sortedByPoints[0];
    const winner3 = sortedByPoints[1];

    // Check for points tie at Title 2 or Title 3
    const isPointsTie2 = sortedByPoints.length > 1 && sortedByPoints[0].pointsTotal === sortedByPoints[1].pointsTotal;
    const isPointsTie3 = sortedByPoints.length > 2 && sortedByPoints[1].pointsTotal === sortedByPoints[2].pointsTotal;

    return {
      title1: {
        titleName: titles.t1,
        winner: winner1,
        tie: isVoteTie,
      },
      title2: {
        titleName: titles.t2,
        winner: winner2,
        tie: isPointsTie2,
      },
      title3: {
        titleName: titles.t3,
        winner: winner3,
        tie: isPointsTie3,
      },
      allFinalistsWithStats: sortedByVotes,
    };
  }

  const boysResults = resolveTitles(
    finalistBoys,
    boyVotesCount,
    pointsTable.boys,
    {
      t1: state.settings.titles.boy1,
      t2: state.settings.titles.boy2,
      t3: state.settings.titles.boy3,
    },
    'boy'
  );

  const girlsResults = resolveTitles(
    finalistGirls,
    girlVotesCount,
    pointsTable.girls,
    {
      t1: state.settings.titles.girl1,
      t2: state.settings.titles.girl2,
      t3: state.settings.titles.girl3,
    },
    'girl'
  );

  return {
    boysResults,
    girlsResults,
    totalVotes: state.votes.length,
    finalResultsLocked: state.settings.finalResultsLocked,
  };
}

app.get('/api/results', (req: Request, res: Response) => {
  res.json(calculateResultsAndTitles());
});

app.post('/api/admin/results/lock', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { locked } = req.body;
  state.settings.finalResultsLocked = Boolean(locked);
  persistState();
  logAudit(`Admin ${locked ? 'LOCKED' : 'UNLOCKED'} final results`, req.user!.username);
  res.json({ success: true, finalResultsLocked: state.settings.finalResultsLocked });
});

// -------------------------------------------------------------
// Projector Stage State Management (ONE ACTIVE SCREEN ONLY)
// -------------------------------------------------------------
let lastStagePingTime = 0;

app.post('/api/stage/ping', (req: Request, res: Response) => {
  lastStagePingTime = Date.now();
  res.json({ success: true, timestamp: lastStagePingTime });
});

app.get('/api/stage/status', (req: Request, res: Response) => {
  const isConnected = Date.now() - lastStagePingTime < 8000;
  res.json({
    connected: isConnected,
    lastPing: lastStagePingTime,
    activeScreen: state.projectorScreen,
  });
});

app.get('/api/projector/state', (req: Request, res: Response) => {
  if (req.query.source === 'stage') {
    lastStagePingTime = Date.now();
  }

  const { boys: nomBoys, girls: nomGirls } = getOfficial16Nominees();
  const { boys: finBoys, girls: finGirls } = getFinalists();
  const points = calculatePointsTable();
  const results = calculateResultsAndTitles();

  // Find eliminated boys and girls
  const eliminatedCandidates = state.participants.filter((p) =>
    state.eliminatedStudentIds.includes(p.id)
  );

  res.json({
    activeScreen: state.projectorScreen,
    stageConnected: Date.now() - lastStagePingTime < 8000,
    settings: {
      eventName: state.settings.eventName,
      collegeName: state.settings.collegeName,
      eventHeading: state.settings.eventHeading,
      stageText: state.settings.stageText,
      titles: state.settings.titles,
    },
    data: {
      nominees: { boys: nomBoys, girls: nomGirls },
      finalists: { boys: finBoys, girls: finGirls },
      pointsTable: points,
      eliminatedCandidates,
      results,
    },
  });
});

app.get('/api/stage/state', (req: Request, res: Response) => {
  // Alias for /api/projector/state
  if (req.query.source === 'stage') {
    lastStagePingTime = Date.now();
  }
  const { boys: nomBoys, girls: nomGirls } = getOfficial16Nominees();
  const { boys: finBoys, girls: finGirls } = getFinalists();
  const points = calculatePointsTable();
  const results = calculateResultsAndTitles();
  const eliminatedCandidates = state.participants.filter((p) =>
    state.eliminatedStudentIds.includes(p.id)
  );
  res.json({
    activeScreen: state.projectorScreen,
    stageConnected: Date.now() - lastStagePingTime < 8000,
    settings: {
      eventName: state.settings.eventName,
      collegeName: state.settings.collegeName,
      eventHeading: state.settings.eventHeading,
      stageText: state.settings.stageText,
      titles: state.settings.titles,
    },
    data: {
      nominees: { boys: nomBoys, girls: nomGirls },
      finalists: { boys: finBoys, girls: finGirls },
      pointsTable: points,
      eliminatedCandidates,
      results,
    },
  });
});

app.get('/api/admin/judge-accounts', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  res.json([
    { judgeId: 'judge1', name: 'Judge 1', username: 'judge1' },
    { judgeId: 'judge2', name: 'Judge 2', username: 'judge2' },
    { judgeId: 'judge3', name: 'Judge 3', username: 'judge3' },
    { judgeId: 'judge4', name: 'Judge 4', username: 'judge4' },
  ]);
});

app.post('/api/admin/projector/screen', requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { screen } = req.body;
  const validScreens: ProjectorScreen[] = [
    'IDLE',
    'BOYS_NOMINATIONS',
    'GIRLS_NOMINATIONS',
    'BOYS_POINTS_TABLE',
    'GIRLS_POINTS_TABLE',
    'BOYS_ELIMINATION',
    'GIRLS_ELIMINATION',
    'QR_VOTING',
    'FINAL_RESULTS',
    'TITLE_REVEAL',
  ];

  if (!validScreens.includes(screen)) {
    res.status(400).json({ error: 'Invalid projector screen identifier' });
    return;
  }

  state.projectorScreen = screen;
  persistState();
  logAudit(`Admin switched projector stage screen to '${screen}'`, req.user!.username);
  res.json({ success: true, activeScreen: state.projectorScreen });
});

// Audit Logs
app.get('/api/admin/audit-logs', requireRole(['ADMIN']), (req: Request, res: Response) => {
  res.json(state.auditLogs);
});

// Mount Vite in dev or serve dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ramp Walk 2026 Event Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
