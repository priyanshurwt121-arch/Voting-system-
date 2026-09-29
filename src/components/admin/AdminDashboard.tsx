import React, { useState, useEffect, useRef } from 'react';
import {
  Candidate,
  EventSettings,
  JudgeScore,
  ProjectorScreen,
  ALLOWED_BRANCHES,
  ScoreValue,
} from '../../types';
import { api } from '../../services/api';
import QRCode from 'qrcode';
import {
  Users,
  Award,
  BarChart3,
  UserX,
  Vote,
  Crown,
  Settings,
  Tv,
  Shield,
  Upload,
  Trash2,
  Lock,
  Unlock,
  Play,
  Pause,
  Copy,
  Check,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  User,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenStage: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  onTabChange,
  onOpenStage,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Core Data
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [participants, setParticipants] = useState<Candidate[]>([]);
  const [nominations, setNominations] = useState<{
    boys: { slotNumber: number; candidate: Candidate | null }[];
    girls: { slotNumber: number; candidate: Candidate | null }[];
  }>({ boys: [], girls: [] });
  const [round2Candidates, setRound2Candidates] = useState<{ boys: Candidate[]; girls: Candidate[] }>({
    boys: [],
    girls: [],
  });
  const [scores, setScores] = useState<Record<string, JudgeScore>>({});
  const [pointsTable, setPointsTable] = useState<any>({ boys: [], girls: [] });
  const [finalists, setFinalists] = useState<{ boys: Candidate[]; girls: Candidate[] }>({
    boys: [],
    girls: [],
  });
  const [votesData, setVotesData] = useState<any>(null);
  const [resultsData, setResultsData] = useState<any>(null);
  const [projectorState, setProjectorState] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlotSelection, setActiveSlotSelection] = useState<{
    gender: 'BOY' | 'GIRL';
    slotIndex: number;
  } | null>(null);

  // New Participant form
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartGender, setNewPartGender] = useState<'BOY' | 'GIRL'>('BOY');
  const [newPartChest, setNewPartChest] = useState<number | ''>('');
  const [newPartBranch, setNewPartBranch] = useState(ALLOWED_BRANCHES[0]);

  // QR Code data URL & copy feedback
  const [adminQrUrl, setAdminQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Elimination selection state
  const [selectedBoyEliminations, setSelectedBoyEliminations] = useState<string[]>([]);
  const [selectedGirlEliminations, setSelectedGirlEliminations] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetPhotoStudentId, setTargetPhotoStudentId] = useState<string | null>(null);

  const [stageConnected, setStageConnected] = useState<boolean>(false);
  const [judgeAccounts, setJudgeAccounts] = useState<any[]>([]);

  const votingUrl = `${window.location.origin}/vote`;
  const judgeLoginUrl = `${window.location.origin}/judge/login`;

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        settingsRes,
        partsRes,
        nomsRes,
        r2CandRes,
        scoresRes,
        ptsRes,
        finRes,
        projRes,
      ] = await Promise.all([
        api.getSettings(),
        api.getParticipants(),
        api.getNominations(),
        api.getRound2Candidates(),
        api.getScores(),
        api.getPointsTable(),
        api.getFinalists(),
        api.getProjectorState(),
      ]);

      setSettings(settingsRes);
      setParticipants(partsRes);
      setNominations(nomsRes);
      setRound2Candidates(r2CandRes);
      setScores(scoresRes);
      setPointsTable(ptsRes);
      setFinalists(finRes);
      setProjectorState(projRes);
      setStageConnected(Boolean(projRes.stageConnected));

      // Load judge accounts for admin
      const jAccounts = await api.getJudgeAccounts().catch(() => []);
      setJudgeAccounts(jAccounts);

      // Lazy load extra tabs
      if (activeTab === 'voting') {
        const vRes = await api.getAdminVotes().catch(() => null);
        if (vRes) setVotesData(vRes);
      }
      if (activeTab === 'titles') {
        const rRes = await api.getResults().catch(() => null);
        if (rRes) setResultsData(rRes);
      }
      if (activeTab === 'security') {
        const logs = await api.getAuditLogs().catch(() => []);
        setAuditLogs(logs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  useEffect(() => {
    const statusInterval = setInterval(async () => {
      try {
        const s = await api.getStageStatus();
        setStageConnected(s.connected);
      } catch {}
    }, 2500);
    return () => clearInterval(statusInterval);
  }, []);

  // Generate QR for Final Voting
  useEffect(() => {
    QRCode.toDataURL(votingUrl, { width: 320, margin: 2 })
      .then((url) => setAdminQrUrl(url))
      .catch(console.error);
  }, [votingUrl]);

  // Auto-fill bottom 2 when on elimination tab
  useEffect(() => {
    if (activeTab === 'elimination') {
      api.autoCalculateElimination().then((res) => {
        if (selectedBoyEliminations.length === 0 && res.boyCandidatesToEliminate.length === 2) {
          setSelectedBoyEliminations(res.boyCandidatesToEliminate);
        }
        if (selectedGirlEliminations.length === 0 && res.girlCandidatesToEliminate.length === 2) {
          setSelectedGirlEliminations(res.girlCandidatesToEliminate);
        }
      }).catch(console.error);
    }
  }, [activeTab]);

  // -------------------------------------------------------------
  // Photo Upload Handler (Admin Only)
  // -------------------------------------------------------------
  const handlePhotoClick = (studentId: string) => {
    setTargetPhotoStudentId(studentId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPhotoStudentId) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        setLoading(true);
        await api.uploadCandidatePhoto(targetPhotoStudentId, base64Data);
        showNotification('Candidate photo updated and synchronized across all screens.');
        loadAllData();
      } catch (err: any) {
        setError(err.message || 'Failed to upload photo');
      } finally {
        setLoading(false);
        setTargetPhotoStudentId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this photo?')) return;
    try {
      setLoading(true);
      await api.deleteCandidatePhoto(studentId);
      showNotification('Candidate photo removed.');
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Nomination Slot Handlers
  // -------------------------------------------------------------
  const handleAssignSlot = async (candidateId: string) => {
    if (!activeSlotSelection) return;
    try {
      setLoading(true);
      await api.assignNominationSlot(
        activeSlotSelection.gender,
        activeSlotSelection.slotIndex,
        candidateId
      );
      showNotification('Nomination slot assigned.');
      setActiveSlotSelection(null);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign slot');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSlot = async (gender: 'BOY' | 'GIRL', slotIndex: number) => {
    try {
      setLoading(true);
      await api.assignNominationSlot(gender, slotIndex, null);
      showNotification('Slot cleared.');
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to clear slot');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || newPartChest === '') return;

    try {
      setLoading(true);
      await api.addParticipant({
        name: newPartName.trim(),
        gender: newPartGender,
        chestNumber: Number(newPartChest),
        branch: newPartBranch,
      });
      showNotification(`Participant '${newPartName}' added to roster.`);
      setNewPartName('');
      setNewPartChest('');
      setShowAddParticipant(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to add participant');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Projector Actions
  // -------------------------------------------------------------
  const handleSetProjectorScreen = async (screen: ProjectorScreen) => {
    try {
      await api.setProjectorScreen(screen);
      setProjectorState((prev: any) => ({ ...prev, activeScreen: screen }));
      showNotification(`Projector switched to [${screen}].`);
    } catch (err: any) {
      setError(err.message || 'Failed to switch projector screen');
    }
  };

  // -------------------------------------------------------------
  // Round 2 Lock / Unlock
  // -------------------------------------------------------------
  const handleToggleRound2Lock = async () => {
    if (!settings) return;
    const newLockState = !settings.round2Locked;
    try {
      await api.lockRound2(newLockState);
      setSettings((prev) => (prev ? { ...prev, round2Locked: newLockState } : null));
      showNotification(
        newLockState ? 'Round 2 scores locked. Judges cannot modify scores.' : 'Round 2 scores unlocked.'
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update lock status');
    }
  };

  // -------------------------------------------------------------
  // Elimination Confirmation
  // -------------------------------------------------------------
  const handleConfirmElimination = async () => {
    if (selectedBoyEliminations.length !== 2 || selectedGirlEliminations.length !== 2) {
      setError('You must select exactly 2 Boys and 2 Girls for elimination.');
      return;
    }

    if (!confirm('Confirm elimination of 2 boys and 2 girls? 12 Finalists will proceed to final voting.'))
      return;

    try {
      setLoading(true);
      await api.confirmElimination(selectedBoyEliminations, selectedGirlEliminations);
      showNotification('Elimination confirmed! 12 Finalists locked for Final Voting.');
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm elimination');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Final Voting Controls
  // -------------------------------------------------------------
  const handleSetVotingStatus = async (status: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'LOCKED') => {
    try {
      await api.setVotingStatus(status);
      setSettings((prev) => (prev ? { ...prev, votingStatus: status } : null));
      showNotification(`Voting status updated to: ${status}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update voting status');
    }
  };

  const copyVotingLink = () => {
    navigator.clipboard.writeText(votingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showNotification('Voting link copied to clipboard.');
  };

  // Filtered participants for slot assignment search
  const availableParticipants = participants.filter((p) => {
    if (!activeSlotSelection) return true;
    if (p.gender !== activeSlotSelection.gender) return false;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.branch.toLowerCase().includes(q) ||
      String(p.chestNumber).includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hidden file input for candidate photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-sm flex items-center gap-3 animate-in fade-in">
          <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Persistent Event & Projector Status Strip */}
      <div className="mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
              stageConnected
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                stageConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>
              {stageConnected ? 'PROJECTOR STATUS: CONNECTED' : 'PROJECTOR STATUS: DISCONNECTED'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">STAGE SCREEN:</span>
            <span className="font-mono text-amber-400 font-bold uppercase">
              {projectorState?.activeScreen?.replace(/_/g, ' ') || 'IDLE'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">VOTING:</span>
            <span className={`font-bold ${settings?.votingStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-400'}`}>
              {settings?.votingStatus || 'NOT_STARTED'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('/stage', '_blank')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Open Stage (/stage)</span>
          </button>
          <button
            onClick={() => window.open('/judge/login', '_blank')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Judge Login</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ROUND 1 — RAMP WALK (8 BOYS + 8 GIRLS NOMINATIONS)     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'round1' && (
        <div className="space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Round 1: Ramp Walk Nominations</h2>
              </div>
              <p className="text-xs text-slate-400">
                Judges decide which 8 Boys and 8 Girls qualify. Admin selects the exact 16 nominees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowAddParticipant(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Participant
              </button>

              <button
                onClick={() => handleSetProjectorScreen('BOYS_NOMINATIONS')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                <Tv className="w-3.5 h-3.5" />
                SHOW BOYS NOMINATIONS
              </button>

              <button
                onClick={() => handleSetProjectorScreen('GIRLS_NOMINATIONS')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-500/20"
              >
                <Tv className="w-3.5 h-3.5" />
                SHOW GIRLS NOMINATIONS
              </button>
            </div>
          </div>

          {/* Section: BOYS NOMINATIONS (8 empty slots) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="text-xl font-bold text-white">BOYS NOMINATIONS (8 SLOTS)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {nominations.boys.filter((b) => b.candidate !== null).length} / 8 Filled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nominations.boys.map((slot, index) => {
                const cand = slot.candidate;
                return (
                  <div
                    key={index}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-blue-400 px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        SLOT #{slot.slotNumber}
                      </span>
                      {cand && (
                        <button
                          onClick={() => handleClearSlot('BOY', index)}
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {cand ? (
                      <div className="space-y-3">
                        {/* Candidate Photo + Admin Photo Controls */}
                        <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative flex items-center justify-center group">
                          {cand.photoUrl ? (
                            <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-slate-600">
                              <User className="w-12 h-12" />
                              <span className="text-[10px] mt-1 text-slate-500">No Photo</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-slate-950/90 border border-amber-500/40 text-amber-400 font-black text-xs px-2 py-0.5 rounded">
                            CHEST #{cand.chestNumber}
                          </div>
                        </div>

                        {/* Candidate Details */}
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">{cand.name}</h4>
                          <p className="text-xs text-amber-400 font-medium">{cand.branch}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {cand.id}</p>
                        </div>

                        {/* Photo Management Buttons (ADMIN ONLY) */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handlePhotoClick(cand.id)}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                          >
                            <Upload className="w-3 h-3 text-amber-400" />
                            {cand.photoUrl ? 'Change' : 'Upload'}
                          </button>
                          {cand.photoUrl ? (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(cand.id)}
                              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          ) : (
                            <div className="flex items-center justify-center text-[10px] text-slate-600">
                              Placeholder
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSlotSelection({ gender: 'BOY', slotIndex: index });
                            setSearchQuery('');
                          }}
                          className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/50 hover:bg-blue-500/5 text-slate-400 hover:text-blue-300 font-semibold text-xs transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <Search className="w-5 h-5 text-blue-400" />
                          <span>[Select Participant]</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: GIRLS NOMINATIONS (8 empty slots) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-pink-500" />
                <h3 className="text-xl font-bold text-white">GIRLS NOMINATIONS (8 SLOTS)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {nominations.girls.filter((g) => g.candidate !== null).length} / 8 Filled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nominations.girls.map((slot, index) => {
                const cand = slot.candidate;
                return (
                  <div
                    key={index}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-pink-400 px-2.5 py-0.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
                        SLOT #{slot.slotNumber}
                      </span>
                      {cand && (
                        <button
                          onClick={() => handleClearSlot('GIRL', index)}
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {cand ? (
                      <div className="space-y-3">
                        {/* Candidate Photo + Admin Photo Controls */}
                        <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative flex items-center justify-center group">
                          {cand.photoUrl ? (
                            <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-slate-600">
                              <User className="w-12 h-12" />
                              <span className="text-[10px] mt-1 text-slate-500">No Photo</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-slate-950/90 border border-amber-500/40 text-amber-400 font-black text-xs px-2 py-0.5 rounded">
                            CHEST #{cand.chestNumber}
                          </div>
                        </div>

                        {/* Candidate Details */}
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">{cand.name}</h4>
                          <p className="text-xs text-rose-400 font-medium">{cand.branch}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {cand.id}</p>
                        </div>

                        {/* Photo Management Buttons (ADMIN ONLY) */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handlePhotoClick(cand.id)}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                          >
                            <Upload className="w-3 h-3 text-rose-400" />
                            {cand.photoUrl ? 'Change' : 'Upload'}
                          </button>
                          {cand.photoUrl ? (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(cand.id)}
                              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          ) : (
                            <div className="flex items-center justify-center text-[10px] text-slate-600">
                              Placeholder
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSlotSelection({ gender: 'GIRL', slotIndex: index });
                            setSearchQuery('');
                          }}
                          className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-slate-800 hover:border-pink-500/60 bg-slate-900/50 hover:bg-pink-500/5 text-slate-400 hover:text-pink-300 font-semibold text-xs transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <Search className="w-5 h-5 text-pink-400" />
                          <span>[Select Participant]</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Participant Search & Selection Modal */}
      {activeSlotSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold">
                  Select {activeSlotSelection.gender} for Slot #{activeSlotSelection.slotIndex + 1}
                </h3>
                <p className="text-xs text-slate-400">Search by Name, Chest Number, or Branch</p>
              </div>
              <button
                onClick={() => setActiveSlotSelection(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="py-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search participant name, chest #, or branch..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 pr-1 space-y-1">
              {availableParticipants.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleAssignSlot(p.id)}
                  className="p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs flex items-center justify-center">
                      #{p.chestNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-400">{p.branch}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-300">
                    ID: {p.id}
                  </span>
                </div>
              ))}

              {availableParticipants.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No matching participants found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Add Participant to Event Roster</h3>
            <form onSubmit={handleCreateParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Participant Name</label>
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={newPartGender}
                    onChange={(e) => setNewPartGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="BOY">BOY</option>
                    <option value="GIRL">GIRL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chest Number</label>
                  <input
                    type="number"
                    value={newPartChest}
                    onChange={(e) => setNewPartChest(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 58"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
                <select
                  value={newPartBranch}
                  onChange={(e) => setNewPartBranch(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {ALLOWED_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddParticipant(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  Add Participant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ROUND 2 — TALENT ROUND (SCORE STATUS & LOCKING)        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'round2' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Round 2: Talent Round Scoring</h2>
              </div>
              <p className="text-xs text-slate-400">
                16 candidates scored by 4 judges (options: 25, 50, 75, 100). Total maximum score: 400.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadAllData}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Refresh scores"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleRound2Lock}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  settings?.round2Locked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                }`}
              >
                {settings?.round2Locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {settings?.round2Locked ? 'UNLOCK ROUND 2' : 'LOCK ROUND 2 SCORES'}
              </button>
            </div>
          </div>

          {/* JUDGE PANEL ACCESS SECTION */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-wide">JUDGE PANEL ACCESS</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official login links for the 4 event judges. Passwords are never displayed publicly.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/judge/login`);
                  showNotification('Judge Login Link (/judge/login) copied to clipboard.');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold self-start sm:self-auto"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Judge Login Link</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { num: 1, id: 'judge1', label: 'Judge 1' },
                { num: 2, id: 'judge2', label: 'Judge 2' },
                { num: 3, id: 'judge3', label: 'Judge 3' },
                { num: 4, id: 'judge4', label: 'Judge 4' },
              ].map((j) => (
                <div
                  key={j.id}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-emerald-400 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        PANEL #{j.num}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{j.id}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{j.label} Login</h4>
                    <p className="text-xs font-mono text-emerald-400 mt-1 select-all break-all">
                      /judge/login
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => window.open('/judge/login', '_blank')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/judge/login`);
                        showNotification(`${j.label} login link copied.`);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      title={`Copy ${j.label} Login Link`}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Judges Scoring Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-x-auto">
            <h3 className="text-lg font-bold text-white mb-4">Official 16 Nominees Scoring Matrix</h3>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Chest #</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Gender</th>
                  <th className="py-3 px-3 text-center">Judge 1</th>
                  <th className="py-3 px-3 text-center">Judge 2</th>
                  <th className="py-3 px-3 text-center">Judge 3</th>
                  <th className="py-3 px-3 text-center">Judge 4</th>
                  <th className="py-3 px-3 text-right">Total / 400</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {[...round2Candidates.boys, ...round2Candidates.girls].map((cand) => {
                  const s1 = scores[`judge1_${cand.id}`]?.score ?? null;
                  const s2 = scores[`judge2_${cand.id}`]?.score ?? null;
                  const s3 = scores[`judge3_${cand.id}`]?.score ?? null;
                  const s4 = scores[`judge4_${cand.id}`]?.score ?? null;
                  const total = (s1 || 0) + (s2 || 0) + (s3 || 0) + (s4 || 0);

                  return (
                    <tr key={cand.id} className="hover:bg-slate-950/40">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">#{cand.chestNumber}</td>
                      <td className="py-3 px-3 font-bold text-white">{cand.name}</td>
                      <td className="py-3 px-3 text-slate-400">{cand.gender}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        {s1 !== null ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold">
                            {s1}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {s2 !== null ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold">
                            {s2}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {s3 !== null ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold">
                            {s3}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {s4 !== null ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold">
                            {s4}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-amber-400 text-sm">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: POINTS TABLE (BOYS & GIRLS LEADERBOARDS)               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'points' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Live Points Table</h2>
              </div>
              <p className="text-xs text-slate-400">
                Sorted highest to lowest total score. Maximum score is 400.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleSetProjectorScreen('BOYS_POINTS_TABLE')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                <Tv className="w-3.5 h-3.5" />
                SHOW BOYS POINTS TABLE
              </button>

              <button
                onClick={() => handleSetProjectorScreen('GIRLS_POINTS_TABLE')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-500/20"
              >
                <Tv className="w-3.5 h-3.5" />
                SHOW GIRLS POINTS TABLE
              </button>
            </div>
          </div>

          {/* Boys Points Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-blue-400 mb-4">BOYS POINTS TABLE (8 CANDIDATES)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Chest #</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3 text-center">J1</th>
                    <th className="py-2.5 px-3 text-center">J2</th>
                    <th className="py-2.5 px-3 text-center">J3</th>
                    <th className="py-2.5 px-3 text-center">J4</th>
                    <th className="py-2.5 px-3 text-right">Total / 400</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {pointsTable.boys.map((row: any, idx: number) => (
                    <tr
                      key={row.candidate.id}
                      className={idx >= 6 ? 'bg-red-500/5' : 'hover:bg-slate-950/40'}
                    >
                      <td className="py-3 px-3 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        #{row.candidate.chestNumber}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{row.candidate.name}</td>
                      <td className="py-3 px-3 text-slate-400">{row.candidate.branch}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.j1 ?? '—'}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.j2 ?? '—'}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.j3 ?? '—'}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.j4 ?? '—'}</td>
                      <td className="py-3 px-3 text-right font-black text-amber-400 text-sm">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Girls Points Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-pink-400 mb-4">GIRLS POINTS TABLE (8 CANDIDATES)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Chest #</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3 text-center">J1</th>
                    <th className="py-2.5 px-3 text-center">J2</th>
                    <th className="py-2.5 px-3 text-center">J3</th>
                    <th className="py-2.5 px-3 text-center">J4</th>
                    <th className="py-2.5 px-3 text-right">Total / 400</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {pointsTable.girls.map((row: any, idx: number) => (
                    <tr
                      key={row.candidate.id}
                      className={idx >= 6 ? 'bg-red-500/5' : 'hover:bg-slate-950/40'}
                    >
                      <td className="py-3 px-3 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        #{row.candidate.chestNumber}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{row.candidate.name}</td>
                      <td className="py-3 px-3 text-slate-400">{row.candidate.branch}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.j1 ?? '—'}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.j2 ?? '—'}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.j3 ?? '—'}</td>
                      <td className="py-3 px-3 text-center font-mono">{row.j4 ?? '—'}</td>
                      <td className="py-3 px-3 text-right font-black text-rose-400 text-sm">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: ELIMINATION (BOTTOM 2 BOYS & 2 GIRLS)                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'elimination' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserX className="w-6 h-6 text-red-400" />
                <h2 className="text-2xl font-bold text-white">Round 2 Elimination</h2>
              </div>
              <p className="text-xs text-slate-400">
                Eliminate bottom 2 Boys & bottom 2 Girls → Exactly 12 Finalists proceed to Final Voting.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleSetProjectorScreen('BOYS_ELIMINATION')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-500/20"
              >
                <Tv className="w-3.5 h-3.5" />
                SHOW BOYS ELIMINATION
              </button>

              <button
                onClick={() => handleSetProjectorScreen('GIRLS_ELIMINATION')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-500/20"
              >
                <Tv className="w-3.5 h-3.5" />
                SHOW GIRLS ELIMINATION
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Boys Elimination Selection */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-bold text-white mb-2">Select 2 Boys to Eliminate</h3>
              <p className="text-xs text-slate-400 mb-4">
                Recommended based on lowest Round 2 totals:
              </p>

              <div className="space-y-2">
                {pointsTable.boys.map((row: any) => {
                  const isChecked = selectedBoyEliminations.includes(row.candidate.id);
                  return (
                    <label
                      key={row.candidate.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-red-500/15 border-red-500/40 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedBoyEliminations.length < 2) {
                                setSelectedBoyEliminations([...selectedBoyEliminations, row.candidate.id]);
                              }
                            } else {
                              setSelectedBoyEliminations(
                                selectedBoyEliminations.filter((id) => id !== row.candidate.id)
                              );
                            }
                          }}
                          className="rounded border-slate-700 text-red-500 focus:ring-0"
                        />
                        <div>
                          <span className="font-bold text-sm text-white">{row.candidate.name}</span>
                          <span className="text-xs text-slate-400 ml-2">({row.candidate.branch})</span>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-bold">
                        Score: {row.total} / 400
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Girls Elimination Selection */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-bold text-white mb-2">Select 2 Girls to Eliminate</h3>
              <p className="text-xs text-slate-400 mb-4">
                Recommended based on lowest Round 2 totals:
              </p>

              <div className="space-y-2">
                {pointsTable.girls.map((row: any) => {
                  const isChecked = selectedGirlEliminations.includes(row.candidate.id);
                  return (
                    <label
                      key={row.candidate.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-red-500/15 border-red-500/40 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedGirlEliminations.length < 2) {
                                setSelectedGirlEliminations([...selectedGirlEliminations, row.candidate.id]);
                              }
                            } else {
                              setSelectedGirlEliminations(
                                selectedGirlEliminations.filter((id) => id !== row.candidate.id)
                              );
                            }
                          }}
                          className="rounded border-slate-700 text-red-500 focus:ring-0"
                        />
                        <div>
                          <span className="font-bold text-sm text-white">{row.candidate.name}</span>
                          <span className="text-xs text-slate-400 ml-2">({row.candidate.branch})</span>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-bold">
                        Score: {row.total} / 400
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleConfirmElimination}
              disabled={selectedBoyEliminations.length !== 2 || selectedGirlEliminations.length !== 2}
              className="py-3 px-8 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all disabled:opacity-40"
            >
              CONFIRM ELIMINATION & LOCK 12 FINALISTS
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: FINAL VOTING (QR, STATUS, TALLIES)                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'voting' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Vote className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Final Voting Administration</h2>
              </div>
              <p className="text-xs text-slate-400">
                Audience + Teacher + Judge final voting for Mr. Fresher and Miss Fresher titles.
              </p>
            </div>

            {/* Voting Status Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSetVotingStatus('ACTIVE')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings?.votingStatus === 'ACTIVE'
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                START VOTING
              </button>

              <button
                onClick={() => handleSetVotingStatus('PAUSED')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings?.votingStatus === 'PAUSED'
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Pause className="w-3.5 h-3.5" />
                PAUSE VOTING
              </button>

              <button
                onClick={() => handleSetVotingStatus('CLOSED')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings?.votingStatus === 'CLOSED'
                    ? 'bg-red-500 text-white ring-2 ring-red-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                CLOSE VOTING
              </button>

              <button
                onClick={() => handleSetVotingStatus('LOCKED')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  settings?.votingStatus === 'LOCKED'
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                LOCK VOTING
              </button>
            </div>
          </div>

          {/* Voting QR and Link Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center flex flex-col justify-between items-center">
              <h3 className="text-sm font-bold text-white mb-2">Audience Voting QR Code</h3>
              <div className="p-3 bg-white rounded-2xl shadow-lg my-2">
                {adminQrUrl ? (
                  <img src={adminQrUrl} alt="Voting QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-xl" />
                )}
              </div>
              <button
                onClick={() => handleSetProjectorScreen('QR_VOTING')}
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
              >
                SHOW QR ON PROJECTOR
              </button>
            </div>

            <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Voting Portal URL</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Share with attendees or open directly to test:
                </p>

                <div className="flex items-center gap-2 mb-6">
                  <input
                    type="text"
                    readOnly
                    value={votingUrl}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono text-amber-400"
                  />
                  <button
                    onClick={copyVotingLink}
                    className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-xs uppercase text-slate-500 font-semibold">Total Verified Votes</span>
                    <p className="text-3xl font-black text-white mt-1">
                      {votesData?.totalVotes || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-xs uppercase text-slate-500 font-semibold">Voting Status</span>
                    <p className="text-xl font-bold text-amber-400 mt-2">
                      {settings?.votingStatus || 'NOT_STARTED'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                <span>🛡️ Strong Server Authentication: 1 Device = 1 Vote Enforced</span>
                <button
                  onClick={loadAllData}
                  className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Count
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: TITLES (EDIT TITLES & ALLOCATION FORMULA)              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'titles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Title Allocation & Results</h2>
              </div>
              <p className="text-xs text-slate-400">
                Title 1 is won by Audience Voting. Titles 2 & 3 are awarded to next highest Round 2 Points candidates.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleSetProjectorScreen('FINAL_RESULTS')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
              >
                <Tv className="w-3.5 h-3.5" />
                SHOW FINAL RESULTS
              </button>

              <button
                onClick={() => handleSetProjectorScreen('TITLE_REVEAL')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                SHOW TITLES ON STAGE
              </button>
            </div>
          </div>

          {/* Editable Titles Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Boys Titles */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-bold text-blue-400 mb-4">Edit Boys Titles</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Boy Title 1 (Audience Voting Winner)
                  </label>
                  <input
                    type="text"
                    value={settings?.titles.boy1 || ''}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        titles: { ...prev.titles, boy1: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Boy Title 2 (Points Table Eligible #1)
                  </label>
                  <input
                    type="text"
                    value={settings?.titles.boy2 || ''}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        titles: { ...prev.titles, boy2: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Boy Title 3 (Points Table Eligible #2)
                  </label>
                  <input
                    type="text"
                    value={settings?.titles.boy3 || ''}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        titles: { ...prev.titles, boy3: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            {/* Girls Titles */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-bold text-pink-400 mb-4">Edit Girls Titles</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Girl Title 1 (Audience Voting Winner)
                  </label>
                  <input
                    type="text"
                    value={settings?.titles.girl1 || ''}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        titles: { ...prev.titles, girl1: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Girl Title 2 (Points Table Eligible #1)
                  </label>
                  <input
                    type="text"
                    value={settings?.titles.girl2 || ''}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        titles: { ...prev.titles, girl2: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Girl Title 3 (Points Table Eligible #2)
                  </label>
                  <input
                    type="text"
                    value={settings?.titles.girl3 || ''}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        titles: { ...prev.titles, girl3: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <button
              onClick={async () => {
                if (!settings) return;
                try {
                  await api.updateSettings({ titles: settings.titles });
                  showNotification('Title names updated successfully.');
                } catch (err: any) {
                  setError(err.message || 'Failed to update titles');
                }
              }}
              className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              SAVE TITLE NAMES
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 7: EVENT SETTINGS                                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Settings className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Event Presentation Settings</h2>
          </div>

          {settings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Event Name</label>
                <input
                  type="text"
                  value={settings.eventName}
                  onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">College / Organization</label>
                <input
                  type="text"
                  value={settings.collegeName}
                  onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Event Date</label>
                <input
                  type="text"
                  value={settings.eventDate}
                  onChange={(e) => setSettings({ ...settings, eventDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Event Time</label>
                <input
                  type="text"
                  value={settings.eventTime}
                  onChange={(e) => setSettings({ ...settings, eventTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Event Location / Venue</label>
                <input
                  type="text"
                  value={settings.eventLocation}
                  onChange={(e) => setSettings({ ...settings, eventLocation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Event Heading</label>
                <input
                  type="text"
                  value={settings.eventHeading}
                  onChange={(e) => setSettings({ ...settings, eventHeading: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Stage Greeting Text</label>
                <input
                  type="text"
                  value={settings.stageText}
                  onChange={(e) => setSettings({ ...settings, stageText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Voting Instructions</label>
                <textarea
                  value={settings.votingInstructions}
                  onChange={(e) => setSettings({ ...settings, votingInstructions: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                />
              </div>
            </div>
          )}

          <div className="text-right pt-4 border-t border-slate-800">
            <button
              onClick={async () => {
                if (!settings) return;
                try {
                  await api.updateSettings(settings);
                  showNotification('Event presentation settings saved.');
                } catch (err: any) {
                  setError(err.message || 'Failed to save settings');
                }
              }}
              className="py-3 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20"
            >
              SAVE SETTINGS
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 8: PROJECTOR CONTROL CONSOLE                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'projector' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Tv className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">PROJECTOR CONTROL</h2>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      stageConnected
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/15 border-red-500/30 text-red-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        stageConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <span>
                      {stageConnected ? 'PROJECTOR STATUS: CONNECTED' : 'PROJECTOR STATUS: DISCONNECTED'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    CURRENT STAGE:
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400 font-extrabold uppercase">
                    {projectorState?.activeScreen?.replace(/_/g, ' ') || 'IDLE'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.open('/stage', '_blank')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <Tv className="w-3.5 h-3.5" />
                  [OPEN STAGE DISPLAY (/stage)]
                </button>
              </div>
            </div>
          </div>

          {/* Grid of all SHOW buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                screen: 'IDLE' as ProjectorScreen,
                title: 'SET IDLE SCREEN',
                desc: 'Main event title, college name, date, animated ambience',
                color: 'hover:border-slate-600',
              },
              {
                screen: 'BOYS_NOMINATIONS' as ProjectorScreen,
                title: 'SHOW BOYS NOMINATIONS',
                desc: '8 boys displayed one by one (4s each)',
                color: 'hover:border-blue-500',
              },
              {
                screen: 'GIRLS_NOMINATIONS' as ProjectorScreen,
                title: 'SHOW GIRLS NOMINATIONS',
                desc: '8 girls displayed one by one (4s each)',
                color: 'hover:border-pink-500',
              },
              {
                screen: 'BOYS_POINTS_TABLE' as ProjectorScreen,
                title: 'SHOW BOYS POINTS TABLE',
                desc: 'Full live leaderboard for 8 boys',
                color: 'hover:border-blue-500',
              },
              {
                screen: 'GIRLS_POINTS_TABLE' as ProjectorScreen,
                title: 'SHOW GIRLS POINTS TABLE',
                desc: 'Full live leaderboard for 8 girls',
                color: 'hover:border-pink-500',
              },
              {
                screen: 'BOYS_ELIMINATION' as ProjectorScreen,
                title: 'SHOW BOYS ELIMINATION',
                desc: 'Bottom 2 boys in red frame one by one (3s each)',
                color: 'hover:border-red-500',
              },
              {
                screen: 'GIRLS_ELIMINATION' as ProjectorScreen,
                title: 'SHOW GIRLS ELIMINATION',
                desc: 'Bottom 2 girls in red frame one by one (3s each)',
                color: 'hover:border-red-500',
              },
              {
                screen: 'QR_VOTING' as ProjectorScreen,
                title: 'SHOW QR',
                desc: 'Large scannable QR Code and voting link',
                color: 'hover:border-amber-500',
              },
              {
                screen: 'FINAL_RESULTS' as ProjectorScreen,
                title: 'SHOW FINAL RESULTS',
                desc: 'Audience vote tallies & Fresher titles',
                color: 'hover:border-amber-500',
              },
              {
                screen: 'TITLE_REVEAL' as ProjectorScreen,
                title: 'SHOW TITLES',
                desc: 'Grand 6 titles reveal with podium celebration',
                color: 'hover:border-purple-500',
              },
            ].map((btn) => {
              const isActive = projectorState?.activeScreen === btn.screen;
              return (
                <div
                  key={btn.screen}
                  onClick={() => handleSetProjectorScreen(btn.screen)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/15 scale-[1.02]'
                      : `bg-slate-900/90 border-slate-800 ${btn.color}`
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isActive ? 'CURRENTLY ACTIVE ON STAGE' : 'TRIGGER STAGE'}
                    </span>
                    <h3 className="font-extrabold text-base text-white mt-2 mb-1">
                      {btn.title}
                    </h3>
                    <p className="text-xs text-slate-400">{btn.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold">
                    <span>Switch Screen</span>
                    <Tv className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 9: SECURITY & AUDIT LOGS                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">System Security & Audit Log</h2>
              <p className="text-xs text-slate-400">
                Server-side authorization records and immutable security events.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Recent Security Logs</h3>
              <button
                onClick={loadAllData}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs pr-1">
              {auditLogs.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">[{log.user}]</span>
                    <span className="text-slate-200">{log.action}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
