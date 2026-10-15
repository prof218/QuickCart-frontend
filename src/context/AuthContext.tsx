'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@/types';
import * as api from '@/lib/api';
import { useNotify } from '@/context/NotificationContext';
import AuthDialog from '@/components/auth/AuthDialog';

type AuthStatus = 'loading' | 'authenticated' | 'guest';
type DialogMode = 'login' | 'register';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Run `action` now if authenticated; otherwise open the login dialog and run it after success. */
  requireAuth: (action: () => void) => void;
  openAuthDialog: (mode?: DialogMode) => void;
  // dialog state (consumed by AuthDialog)
  dialogOpen: boolean;
  dialogMode: DialogMode;
  setDialogMode: (mode: DialogMode) => void;
  closeAuthDialog: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const notify = useNotify();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('login');
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Bootstrap: who am I?
  useEffect(() => {
    let active = true;
    api
      .getMe()
      .then((u) => {
        if (!active) return;
        setUser(u);
        setStatus(u ? 'authenticated' : 'guest');
      })
      .catch(() => {
        if (!active) return;
        setStatus('guest');
      });
    return () => {
      active = false;
    };
  }, []);

  // After the user becomes authenticated, close the dialog and resume any pending action.
  // Runs after child providers' effects (e.g. the cart reloads for the new user) so the
  // resumed action operates on the correct per-user state. setState here is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      setDialogOpen(false);
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action) action();
    }
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await api.login({ email, password });
      setUser(u);
      setStatus('authenticated');
      notify.success(`Welcome back, ${u.name.split(' ')[0]}!`);
    },
    [notify],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const u = await api.register({ name, email, password });
      setUser(u);
      setStatus('authenticated');
      notify.success(`Account created — welcome, ${u.name.split(' ')[0]}!`);
    },
    [notify],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* even if the call fails, clear local state */
    }
    setUser(null);
    setStatus('guest');
    notify.info('You have been logged out.');
  }, [notify]);

  const openAuthDialog = useCallback((mode: DialogMode = 'login') => {
    pendingActionRef.current = null;
    setDialogMode(mode);
    setDialogOpen(true);
  }, []);

  const closeAuthDialog = useCallback(() => {
    // Dismissal: drop the intended action and return to browsing.
    pendingActionRef.current = null;
    setDialogOpen(false);
  }, []);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setDialogMode('login');
      setDialogOpen(true);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      requireAuth,
      openAuthDialog,
      dialogOpen,
      dialogMode,
      setDialogMode,
      closeAuthDialog,
    }),
    [user, status, login, register, logout, requireAuth, openAuthDialog, dialogOpen, dialogMode, closeAuthDialog],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthDialog />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
