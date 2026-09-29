import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AdminLogin } from './components/auth/AdminLogin';
import { JudgeLogin } from './components/auth/JudgeLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { JudgePanel } from './components/judge/JudgePanel';
import { AudienceVotingPage } from './components/audience/AudienceVotingPage';
import { ProjectorDisplay } from './components/projector/ProjectorDisplay';

function MainRouter() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeAdminTab, setActiveAdminTab] = useState('round1');

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs tracking-wider uppercase font-mono">
            Verifying Security Session...
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // -------------------------------------------------------------
    // Route 1: STAGE / PROJECTOR DISPLAY (/stage)
    // Display-only, no admin/judge/voting controls
    // -------------------------------------------------------------
    if (currentPath === '/stage' || currentPath === '/projector') {
      return (
        <div className="min-h-screen bg-black text-white">
          <ProjectorDisplay />
        </div>
      );
    }

    // -------------------------------------------------------------
    // Route 2: ADMIN LOGIN (/admin/login)
    // -------------------------------------------------------------
    if (currentPath === '/admin/login') {
      if (user?.role === 'ADMIN') {
        navigateTo('/admin');
        return null;
      }
      return <AdminLogin onSuccess={() => navigateTo('/admin')} />;
    }

    // -------------------------------------------------------------
    // Route 3: ADMIN PANEL (/admin)
    // Protected - requires ADMIN authorization
    // If not authenticated, redirect to /admin/login
    // -------------------------------------------------------------
    if (currentPath === '/admin') {
      if (user?.role !== 'ADMIN') {
        navigateTo('/admin/login');
        return null;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
          <Navbar
            onOpenLogin={() => navigateTo('/admin/login')}
            onLogout={() => navigateTo('/admin/login')}
            activeAdminTab={activeAdminTab}
            onSelectAdminTab={setActiveAdminTab}
            onOpenStage={() => window.open('/stage', '_blank')}
          />
          <main className="flex-1">
            <AdminDashboard
              activeTab={activeAdminTab}
              onTabChange={setActiveAdminTab}
              onOpenStage={() => window.open('/stage', '_blank')}
            />
          </main>
        </div>
      );
    }

    // -------------------------------------------------------------
    // Route 4: JUDGE LOGIN (/judge/login)
    // -------------------------------------------------------------
    if (currentPath === '/judge/login') {
      if (user?.role === 'JUDGE') {
        navigateTo('/judge');
        return null;
      }
      return <JudgeLogin onSuccess={() => navigateTo('/judge')} />;
    }

    // -------------------------------------------------------------
    // Route 5: JUDGE PANEL (/judge)
    // Protected - requires JUDGE authorization
    // If not authenticated, redirect to /judge/login
    // -------------------------------------------------------------
    if (currentPath === '/judge') {
      if (user?.role !== 'JUDGE') {
        navigateTo('/judge/login');
        return null;
      }

      return (
        <main className="min-h-screen bg-slate-950 pb-24">
          <JudgePanel onLogout={() => navigateTo('/judge/login')} />
        </main>
      );
    }

    // -------------------------------------------------------------
    // Route 6: PUBLIC VOTING (/vote)
    // Pure voting interface only.
    // -------------------------------------------------------------
    if (currentPath === '/vote') {
      return (
        <div className="pb-24">
          <AudienceVotingPage onNavigate={navigateTo} />
        </div>
      );
    }

    // -------------------------------------------------------------
    // Root (/) Landing behavior
    // If authenticated as ADMIN -> redirect to /admin
    // If authenticated as JUDGE -> redirect to /judge
    // Otherwise -> provide public voting interface (/vote)
    // -------------------------------------------------------------
    if (user?.role === 'ADMIN') {
      navigateTo('/admin');
      return null;
    }

    if (user?.role === 'JUDGE') {
      navigateTo('/judge');
      return null;
    }

    // Default fallback for root or any other public route: Clean Voting Page
    return (
      <div className="pb-24">
        <AudienceVotingPage onNavigate={navigateTo} />
      </div>
    );
  };

  return <>{renderContent()}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
