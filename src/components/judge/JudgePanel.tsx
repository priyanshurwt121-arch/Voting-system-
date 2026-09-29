import React, { useState, useEffect } from 'react';
import { Candidate, JudgeScore, ScoreValue } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Lock, ArrowLeft, Award, User, RefreshCw, LogOut, Check, Users } from 'lucide-react';

interface JudgePanelProps {
  onLogout?: () => void;
}

export const JudgePanel: React.FC<JudgePanelProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'TALENT_SCORING' | 'NOMINATION_STATUS'>('TALENT_SCORING');
  const [activeGender, setActiveGender] = useState<'BOYS' | 'GIRLS'>('BOYS');
  const [candidates, setCandidates] = useState<{ boys: Candidate[]; girls: Candidate[] }>({
    boys: [],
    girls: [],
  });
  const [scores, setScores] = useState<Record<string, JudgeScore>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [round2Locked, setRound2Locked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const judgeId = user?.judgeId;

  // Format judge name nicely: e.g. "Judge 1"
  const judgeDisplayTitle = user?.username === 'judge1' ? 'Judge 1' :
                            user?.username === 'judge2' ? 'Judge 2' :
                            user?.username === 'judge3' ? 'Judge 3' :
                            user?.username === 'judge4' ? 'Judge 4' : (user?.name || 'Judge');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [candRes, scoresRes, settingsRes] = await Promise.all([
        api.getRound2Candidates(),
        api.getScores(),
        api.getSettings(),
      ]);
      setCandidates(candRes);
      setScores(scoresRes);
      setRound2Locked(settingsRes.round2Locked);
    } catch (err: any) {
      setError(err.message || 'Failed to load judging data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectScore = async (score: ScoreValue) => {
    if (!selectedCandidate || !judgeId || round2Locked) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.submitScore(selectedCandidate.id, score);
      setScores((prev) => ({
        ...prev,
        [`${judgeId}_${selectedCandidate.id}`]: {
          judgeId,
          studentId: selectedCandidate.id,
          score,
          updatedAt: new Date().toISOString(),
        },
      }));
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  const getCandidateScore = (studentId: string) => {
    if (!judgeId) return null;
    return scores[`${judgeId}_${studentId}`]?.score ?? null;
  };

  const currentList = activeGender === 'BOYS' ? candidates.boys : candidates.girls;

  // Individual Candidate Scoring Screen
  if (selectedCandidate) {
    const currentScore = getCandidateScore(selectedCandidate.id);

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setSelectedCandidate(null);
              setSaveSuccess(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            [BACK TO CANDIDATES]
          </button>

          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Scoring as</span>
            <span className="text-sm font-bold text-emerald-400">{judgeDisplayTitle}</span>
          </div>
        </div>

        {round2Locked && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Round 2 Scoring Locked</p>
              <p className="text-xs text-amber-400/80">Admin has locked scores. Scores are currently read-only.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold text-base">SCORE SAVED ✓</p>
              <p className="text-xs text-emerald-300/80">Your score of {currentScore} points was saved to the server.</p>
            </div>
          </div>
        )}

        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Candidate Photo */}
          <div className="w-40 h-52 sm:w-48 sm:h-64 mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 mb-6 shadow-inner relative flex items-center justify-center">
            {selectedCandidate.photoUrl ? (
              <img
                src={selectedCandidate.photoUrl}
                alt={selectedCandidate.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600">
                <User className="w-16 h-16 stroke-[1.5]" />
                <span className="text-[11px] mt-2 font-mono text-slate-500">Candidate Photo</span>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-slate-950/90 border border-amber-500/40 text-amber-400 font-black text-xs px-3 py-1 rounded-lg">
              CHEST #{selectedCandidate.chestNumber}
            </div>
          </div>

          {/* Candidate Details */}
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">{selectedCandidate.name}</h2>
          <p className="text-amber-400 font-bold text-base mb-1">{selectedCandidate.branch}</p>
          <p className="text-xs text-slate-400 font-mono mb-8">Student ID: {selectedCandidate.id}</p>

          {/* Scoring Title */}
          <div className="border-t border-slate-800/80 pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Choose One Score Option
              </span>
              {currentScore !== null && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Current: {currentScore} / 100
                </span>
              )}
            </div>

            {/* Exactly 4 scoring buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {([25, 50, 75, 100] as ScoreValue[]).map((val) => {
                const isSelected = currentScore === val;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={round2Locked || submitting}
                    onClick={() => handleSelectScore(val)}
                    className={`py-4 sm:py-5 px-3 rounded-2xl font-black text-xl sm:text-2xl transition-all flex flex-col items-center justify-center gap-1 border ${
                      isSelected
                        ? 'bg-gradient-to-b from-emerald-400 to-teal-500 text-slate-950 border-emerald-300 shadow-xl shadow-emerald-500/30 scale-105'
                        : 'bg-slate-950 hover:bg-slate-800/90 text-slate-200 border-slate-800 hover:border-slate-700'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <span>{val}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                      {val === 100 ? '100 Pts' : val === 75 ? '75 Pts' : val === 50 ? '50 Pts' : '25 Pts'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedCandidate(null);
                setSaveSuccess(false);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
            >
              [BACK TO CANDIDATES]
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Judge View
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Top Judge Header */}
      <div className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  LOGGED IN AS:
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold text-xs uppercase tracking-wider border border-emerald-500/30">
                  {judgeDisplayTitle}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                Ramp Walk 2026 • Judge Scoring Panel
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-2 pb-2">
          <button
            onClick={() => setActiveSection('TALENT_SCORING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'TALENT_SCORING'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ROUND 2 — TALENT SCORING
          </button>
          <button
            onClick={() => setActiveSection('NOMINATION_STATUS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === 'NOMINATION_STATUS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ROUND 1 / NOMINATION STATUS
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        {round2Locked && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Round 2 Scoring Locked</p>
              <p className="text-xs text-amber-400/80">Admin has locked scores. Scores cannot be changed.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* SECTION 1: TALENT SCORING */}
        {activeSection === 'TALENT_SCORING' && (
          <>
            {/* Gender Toggle */}
            <div className="flex rounded-2xl bg-slate-900 p-1.5 mb-8 border border-slate-800 max-w-sm mx-auto">
              <button
                onClick={() => setActiveGender('BOYS')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all ${
                  activeGender === 'BOYS'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BOYS ({candidates.boys.length})
              </button>
              <button
                onClick={() => setActiveGender('GIRLS')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all ${
                  activeGender === 'GIRLS'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                GIRLS ({candidates.girls.length})
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-xs text-slate-400">
                Tap any candidate card below to open the scoring dialog ({judgeDisplayTitle} seat)
              </p>
            </div>

            {/* Candidate Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {currentList.map((cand) => {
                const score = getCandidateScore(cand.id);
                const hasScored = score !== null;

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className="group cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 text-center transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo */}
                      <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-3 relative flex items-center justify-center">
                        {cand.photoUrl ? (
                          <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-slate-600" />
                        )}
                        <div className="absolute top-2 left-2 bg-slate-950/90 border border-amber-500/40 text-amber-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md">
                          CHEST #{cand.chestNumber}
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="font-bold text-white text-sm sm:text-base leading-tight group-hover:text-emerald-400 transition-colors">
                        {cand.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cand.branch}</p>
                    </div>

                    {/* Score status badge */}
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      {hasScored ? (
                        <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Score: {score}</span>
                        </div>
                      ) : (
                        <div className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-medium text-xs group-hover:border-emerald-500/30 group-hover:text-emerald-300">
                          Tap to Score
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {currentList.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                No candidates available for Round 2 yet.
              </div>
            )}
          </>
        )}

        {/* SECTION 2: NOMINATION STATUS */}
        {activeSection === 'NOMINATION_STATUS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Round 1 Nominees Status</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Judges qualify 8 Boys and 8 Girls from Round 1. Admin confirms the 16 official Round 2 nominees.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Boys List */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center justify-between">
                  <span>8 QUALIFIED BOYS</span>
                  <span className="text-xs text-slate-500 font-mono">{candidates.boys.length} / 8</span>
                </h3>
                <div className="divide-y divide-slate-800/60">
                  {candidates.boys.map((b, idx) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-slate-500 w-5">{idx + 1}.</span>
                        <span className="font-bold text-white">{b.name}</span>
                        <span className="text-slate-400">({b.branch})</span>
                      </div>
                      <span className="text-amber-400 font-mono font-bold">Chest #{b.chestNumber}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Girls List */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-pink-400 mb-3 flex items-center justify-between">
                  <span>8 QUALIFIED GIRLS</span>
                  <span className="text-xs text-slate-500 font-mono">{candidates.girls.length} / 8</span>
                </h3>
                <div className="divide-y divide-slate-800/60">
                  {candidates.girls.map((g, idx) => (
                    <div key={g.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-slate-500 w-5">{idx + 1}.</span>
                        <span className="font-bold text-white">{g.name}</span>
                        <span className="text-slate-400">({g.branch})</span>
                      </div>
                      <span className="text-rose-400 font-mono font-bold">Chest #{g.chestNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
