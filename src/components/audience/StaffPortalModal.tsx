import React from 'react';
import { Shield, X, ArrowRight, Award } from 'lucide-react';

interface StaffPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const StaffPortalModal: React.FC<StaffPortalModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const handleAdminClick = () => {
    onClose();
    onNavigate('/admin/login');
  };

  const handleJudgeClick = () => {
    onClose();
    onNavigate('/judge/login');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close Staff Portal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-md shadow-amber-500/5">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white uppercase">
            STAFF PORTAL
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Authorized Event Staff Only
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAdminClick}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 hover:border-amber-500/40 text-white font-bold text-sm flex items-center justify-between transition-all group shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="tracking-wide">ADMIN LOGIN</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={handleJudgeClick}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 hover:border-emerald-500/40 text-white font-bold text-sm flex items-center justify-between transition-all group shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="tracking-wide">JUDGE LOGIN</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Authorized Personnel Only • Session Authenticated
          </p>
        </div>
      </div>
    </div>
  );
};
