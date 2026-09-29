import React from 'react';
import { Sparkles, Shield, UserCheck, Tv, LogOut, KeyRound, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenLogin: () => void;
  onLogout?: () => void;
  activeAdminTab?: string;
  onSelectAdminTab?: (tab: string) => void;
  onOpenStage?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  onLogout,
  activeAdminTab,
  onSelectAdminTab,
  onOpenStage,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onLogout) {
      onLogout();
    } else {
      window.history.pushState({}, '', '/admin/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-wider bg-gradient-to-r from-amber-200 via-rose-200 to-amber-400 bg-clip-text text-transparent">
                  RAMP WALK 2026
                </span>
                {user?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Admin
                  </span>
                )}
                {user?.role === 'JUDGE' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Judge
                  </span>
                )}
                {user?.role === 'PROJECTOR' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Stage Display
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Cultural Fest & Talent Competition • Official Portal
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'ADMIN' && onOpenStage && (
                  <button
                    onClick={onOpenStage}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold transition-all"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    Open Projector View
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </button>
                )}

                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-white">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-medium transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
                title="Event Staff / Judge Login"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Staff Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Admin Navigation Bar */}
        {user?.role === 'ADMIN' && onSelectAdminTab && (
          <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-900 scrollbar-none text-xs font-medium">
            {[
              { id: 'round1', label: '1. Round 1' },
              { id: 'round2', label: '2. Round 2' },
              { id: 'points', label: '3. Points Table' },
              { id: 'elimination', label: '4. Elimination' },
              { id: 'voting', label: '5. Final Voting' },
              { id: 'titles', label: '6. Titles' },
              { id: 'settings', label: '7. Event Settings' },
              { id: 'projector', label: '8. Projector Control' },
              { id: 'security', label: '9. Security' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectAdminTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeAdminTab === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
