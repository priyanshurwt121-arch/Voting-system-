import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';

interface AccessDeniedProps {
  onGoHome?: () => void;
  onOpenLogin?: () => void;
  attemptedRole?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  onGoHome,
  onOpenLogin,
  attemptedRole,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 mb-3">
          Security Alert
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Access Denied
        </h1>

        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You do not have authorization to access {attemptedRole ? `the ${attemptedRole} panel` : 'this protected area'}.
          Server-side access policies require verified credentials. Unauthorized access attempts are monitored and logged.
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 mb-6 font-mono text-left">
          <div className="text-slate-300 font-semibold mb-1">Security Directive:</div>
          <div>Status: <span className="text-red-400">403 Forbidden</span></div>
          <div>Role validation: <span className="text-amber-400">FAILED</span></div>
          <div>Origin IP & device verified: <span className="text-emerald-400">ENFORCED</span></div>
        </div>

        <div className="flex flex-col gap-3">
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold transition-all shadow-lg shadow-amber-500/20"
            >
              <KeyRound className="w-4 h-4" />
              Staff / Judge Login
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Audience Voting
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
