import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, Role } from '../types';
import { api, setAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  stageLogin: (stageKey: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string): Promise<AuthUser> => {
    const res = await api.login(username, password);
    setAuthToken(res.token);
    const authUser: AuthUser = {
      role: res.role,
      username: res.username,
      name: res.name,
      judgeId: res.judgeId as any,
    };
    setUser(authUser);
    return authUser;
  };

  const stageLogin = async (stageKey: string): Promise<AuthUser> => {
    const res = await api.stageLogin(stageKey);
    setAuthToken(res.token);
    const authUser: AuthUser = {
      role: res.role,
      username: res.username,
      name: res.name,
    };
    setUser(authUser);
    return authUser;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, stageLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
