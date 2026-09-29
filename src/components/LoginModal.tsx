import React, { useState } from 'react';
import { Lock, User, Key, X, Shield, Tv } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: 'STAFF' | 'STAGE';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'STAFF',
}) => {
  const { login, stageLogin } = useAuth();
  const [tab, setTab] = useState<'STAFF' | 'STAGE'>(defaultTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stageKey, setStageKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'STAFF') {
        if (!username.trim() || !password) {
          setError('Please enter both username and password.');
          setLoading(false);
          return;
        }
        await login(username.trim(), password);
      } else {
        if (!stageKey.trim()) {
          setError('Please enter the Stage Display Key.');
          setLoading(false);
          return;
        }
        await stageLogin(stageKey.trim());
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Authorized Sign In</h2>
              <p className="text-xs text-slate-400">Ramp Walk 2026 Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('STAFF');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'STAFF'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Admin / Judge
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('STAGE');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'STAGE'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            Projector Stage
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'STAFF' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Account Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin or judge1, judge2, ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Stage Projector Display Key
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={stageKey}
                  onChange={(e) => setStageKey(e.target.value)}
                  placeholder="Enter projector stage key"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Managed securely by Event Admin. Display-only mode for auditorium screen.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : tab === 'STAFF' ? 'Sign In to Panel' : 'Access Projector Display'}
          </button>
        </form>
      </div>
    </div>
  );
};
