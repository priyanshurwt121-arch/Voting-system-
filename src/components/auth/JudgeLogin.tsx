import React, { useState, useEffect } from 'react';
import { Award, Lock, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface JudgeLoginProps {
  onSuccess: () => void;
}

export const JudgeLogin: React.FC<JudgeLoginProps> = ({ onSuccess }) => {
  const { user, login } = useAuth();
  const [selectedJudge, setSelectedJudge] = useState<'judge1' | 'judge2' | 'judge3' | 'judge4'>('judge1');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'JUDGE') {
      onSuccess();
    }
  }, [user, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const authUser = await login(selectedJudge, password);
      if (authUser.role !== 'JUDGE') {
        setError('This account does not have Judge privileges.');
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid judge credentials. Please verify your password.');
    } finally {
      setLoading(false);
    }
  };

  const JUDGE_LIST = [
    { id: 'judge1' as const, label: 'Judge 1', desc: 'Panel Seat 1' },
    { id: 'judge2' as const, label: 'Judge 2', desc: 'Panel Seat 2' },
    { id: 'judge3' as const, label: 'Judge 3', desc: 'Panel Seat 3' },
    { id: 'judge4' as const, label: 'Judge 4', desc: 'Panel Seat 4' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-500/10 via-amber-500/10 to-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Award className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Official Jury Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Judge Scoring Login
          </h1>
          <p className="text-slate-400 text-xs mt-1.5">
            Round 2: Talent Round • 4 Dedicated Judge Accounts
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Judge Seat */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Your Judge Account
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {JUDGE_LIST.map((j) => {
                const isSelected = selectedJudge === j.id;
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setSelectedJudge(j.id);
                      setError(null);
                    }}
                    className={`py-3 px-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10 scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-sm text-white">{j.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{j.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Judge Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            <span>{loading ? 'Authenticating...' : `Sign In as ${selectedJudge.toUpperCase()}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Isolated judge score records • 25, 50, 75, 100 validation
          </p>
        </div>
      </div>
    </div>
  );
};
