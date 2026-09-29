import React, { useState, useEffect } from 'react';
import { Candidate, ALLOWED_BRANCHES } from '../../types';
import { api } from '../../services/api';
import { Check, CheckCircle2, AlertCircle, Sparkles, User, ShieldCheck, Lock } from 'lucide-react';
import { StaffPortalModal } from './StaffPortalModal';

interface AudienceVotingPageProps {
  onNavigate?: (path: string) => void;
}

export const AudienceVotingPage: React.FC<AudienceVotingPageProps> = ({ onNavigate }) => {
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [config, setConfig] = useState<{
    votingStatus: string;
    votingInstructions: string;
    eventName: string;
    collegeName: string;
    boys: Candidate[];
    girls: Candidate[];
  } | null>(null);

  const [fullName, setFullName] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedBoyId, setSelectedBoyId] = useState<string | null>(null);
  const [selectedGirlId, setSelectedGirlId] = useState<string | null>(null);

  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate or retrieve unique device fingerprint
  const getDeviceFingerprint = () => {
    let fp = localStorage.getItem('rw_device_fingerprint');
    if (!fp) {
      fp = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem('rw_device_fingerprint', fp);
    }
    return fp;
  };

  useEffect(() => {
    // Check if device already recorded vote locally as well
    if (localStorage.getItem('rw_has_voted') === 'true') {
      setHasVoted(true);
    }

    const loadConfig = async () => {
      try {
        setLoading(true);
        const data = await api.getVoteConfig();
        setConfig(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to connect to voting server.');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const cleanName = fullName.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2) {
      setErrorMessage('Please enter your complete Full Name.');
      return;
    }

    if (!branch || !ALLOWED_BRANCHES.includes(branch as any)) {
      setErrorMessage('Please select a valid Branch from the approved list.');
      return;
    }

    if (!selectedBoyId || !selectedGirlId) {
      setErrorMessage('You must select exactly ONE Boy and ONE Girl before submitting.');
      return;
    }

    const deviceFingerprint = getDeviceFingerprint();

    try {
      setSubmitting(true);
      const res = await api.submitVote({
        name: cleanName,
        branch,
        boyStudentId: selectedBoyId,
        girlStudentId: selectedGirlId,
        deviceFingerprint,
      });

      localStorage.setItem('rw_has_voted', 'true');
      setHasVoted(true);
      setSuccessMessage(res.message || 'Vote submitted successfully! Thank you for participating.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Vote submission failed. Multiple voting is strictly prohibited.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Connecting to voting system...</p>
        </div>
      </div>
    );
  }

  // Voting Status Check
  const isVotingActive = config?.votingStatus === 'ACTIVE';

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* LEFT: RAMP WALK 2026 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-wider bg-gradient-to-r from-amber-200 via-rose-200 to-amber-400 bg-clip-text text-transparent">
                RAMP WALK 2026
              </span>
            </div>
          </div>

          {/* RIGHT: STAFF PORTAL */}
          <button
            onClick={() => setShowStaffModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Authorized Event Staff Only"
          >
            <span>🔐 STAFF PORTAL</span>
          </button>
        </div>
      </header>

      {/* Staff Portal Modal */}
      <StaffPortalModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onNavigate={handleNavigate}
      />

      {/* Header Banner */}
      <div className="relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 py-10 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Official Audience & Jury Voting
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-rose-200 to-amber-400 bg-clip-text text-transparent mb-3">
            {config?.eventName || 'RAMP WALK 2026'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            {config?.collegeName || 'Annual Cultural Extravaganza'}
          </p>

          <p className="mt-4 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed bg-slate-900/60 border border-slate-800 py-2.5 px-4 rounded-xl">
            {config?.votingInstructions ||
              'Choose your favorite finalists! Select exactly 1 Boy and 1 Girl. Only 1 vote per verified device is permitted.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Has Already Voted Card */}
        {hasVoted ? (
          <div className="max-w-xl mx-auto bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-md">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">VOTE SUBMITTED ✓</h2>
            <p className="text-emerald-400 font-semibold text-sm mb-4">
              You have already voted.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Your votes for <strong className="text-white">Mr. Fresher</strong> and{' '}
              <strong className="text-white">Miss Fresher</strong> have been authenticated and recorded on the server.
              Thank you for participating!
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>One-Device Security Policy Enforced</span>
            </div>
          </div>
        ) : !isVotingActive ? (
          /* Voting Inactive Banner */
          <div className="max-w-xl mx-auto bg-slate-900 border border-amber-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Voting is Not Active</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {config?.votingStatus === 'NOT_STARTED' &&
                'Final voting has not started yet. Please wait for the event administrator to open voting.'}
              {config?.votingStatus === 'PAUSED' &&
                'Voting is currently paused by the event administrator. Please stay on this page.'}
              {config?.votingStatus === 'CLOSED' &&
                'Final voting is now officially closed. Results will be announced on the stage projector shortly.'}
              {config?.votingStatus === 'LOCKED' &&
                'Final voting is locked. Results are finalized.'}
            </p>
          </div>
        ) : (
          /* Voting Form */
          <form onSubmit={handleSubmitVote} className="space-y-10">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-bold">Submission Rejected</p>
                  <p className="text-xs text-red-300/90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Voter Identity Section */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Voter Identification</h2>
                  <p className="text-xs text-slate-400">Required to verify one unique vote per attendee</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your first and last name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Academic Branch <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    required
                  >
                    <option value="" disabled>Select your branch from list</option>
                    {ALLOWED_BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Boys Finalists Selection (3x2 grid) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Select ONE Boy Finalist</h2>
                    <p className="text-xs text-slate-400">Vote for Mr. Fresher title candidate</p>
                  </div>
                </div>

                <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  {selectedBoyId
                    ? `Selected: ${config?.boys.find((b) => b.id === selectedBoyId)?.name}`
                    : '1 Boy Required'}
                </div>
              </div>

              {/* 3x2 Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {config?.boys.map((cand) => {
                  const isSelected = selectedBoyId === cand.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedBoyId(cand.id)}
                      className={`relative cursor-pointer rounded-2xl p-3 sm:p-4 text-center transition-all flex flex-col justify-between border-2 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-500/15 scale-[1.02]'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Selection Checkmark */}
                      <div
                        className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold scale-110 shadow'
                            : 'bg-slate-900 border border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      {/* Photo */}
                      <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-3 relative flex items-center justify-center">
                        {cand.photoUrl ? (
                          <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-slate-600" />
                        )}
                        <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-amber-500/40 text-amber-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md">
                          CHEST #{cand.chestNumber}
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                          {cand.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cand.branch}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Girls Finalists Selection (3x2 grid) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Select ONE Girl Finalist</h2>
                    <p className="text-xs text-slate-400">Vote for Miss Fresher title candidate</p>
                  </div>
                </div>

                <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  {selectedGirlId
                    ? `Selected: ${config?.girls.find((g) => g.id === selectedGirlId)?.name}`
                    : '1 Girl Required'}
                </div>
              </div>

              {/* 3x2 Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {config?.girls.map((cand) => {
                  const isSelected = selectedGirlId === cand.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedGirlId(cand.id)}
                      className={`relative cursor-pointer rounded-2xl p-3 sm:p-4 text-center transition-all flex flex-col justify-between border-2 ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-400 shadow-xl shadow-rose-500/15 scale-[1.02]'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Selection Checkmark */}
                      <div
                        className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                          isSelected
                            ? 'bg-rose-400 text-slate-950 font-bold scale-110 shadow'
                            : 'bg-slate-900 border border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      {/* Photo */}
                      <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-3 relative flex items-center justify-center">
                        {cand.photoUrl ? (
                          <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-slate-600" />
                        )}
                        <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-rose-500/40 text-rose-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md">
                          CHEST #{cand.chestNumber}
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                          {cand.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cand.branch}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission CTA */}
            <div className="text-center pt-2">
              <button
                type="submit"
                disabled={submitting || !selectedBoyId || !selectedGirlId || !fullName.trim() || !branch}
                className="w-full sm:w-auto min-w-[280px] py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-lg tracking-wide uppercase shadow-2xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? 'Authenticating & Submitting...' : 'SUBMIT FINAL VOTE'}
              </button>
              <p className="mt-3 text-xs text-slate-500">
                🔒 Authenticated Submission • One vote per device policy enforced
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
