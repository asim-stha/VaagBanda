import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, authService } from '../services/authService';
import { biometricService } from '../services/biometricService';
import { supabase } from '../lib/supabase';

// Fetches avatar_url directly from profiles table.
// authService.fetchProfile() already tries this, but falls back to a query
// without avatar_url when the first query errors, so avatarUrl can end up
// undefined even when the row has the column. This supplements that gap.
const fetchProfileAvatar = async (userId: string): Promise<string | undefined> => {
  const { data } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', userId)
    .single();
  return data?.avatar_url ?? undefined;
};

interface LocalSession {
  access_token: string;
  user: AppUser;
}

interface AuthContextType {
  user: AppUser | null;
  session: LocalSession | null;
  loading: boolean;
  biometricLocked: boolean;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  unlockBiometric: () => Promise<boolean>;
  enableBiometricLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  biometricLocked: false,
  refreshAuth: async () => {},
  signOut: async () => {},
  unlockBiometric: async () => false,
  enableBiometricLogin: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricLocked, setBiometricLocked] = useState(false);

  const refreshAuth = async () => {
    setLoading(true);
    try {
      const nextSession = await authService.getSession();
      if (nextSession?.user && !nextSession.user.avatarUrl) {
        const avatarUrl = await fetchProfileAvatar(nextSession.user.id);
        if (avatarUrl) nextSession.user = { ...nextSession.user, avatarUrl };
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const nextSession = await authService.getSession();
        if (nextSession?.user && !nextSession.user.avatarUrl) {
          const avatarUrl = await fetchProfileAvatar(nextSession.user.id);
          if (avatarUrl) nextSession.user = { ...nextSession.user, avatarUrl };
        }
        if (nextSession) {
          // Existing session on app open — check if biometric lock should apply
          const shouldLock = await biometricService.isEnabled();
          setBiometricLocked(shouldLock);
        }
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        // Fresh password login — no biometric lock
        const nextSession = await authService.getSession();
        if (nextSession?.user && !nextSession.user.avatarUrl) {
          const avatarUrl = await fetchProfileAvatar(nextSession.user.id);
          if (avatarUrl) nextSession.user = { ...nextSession.user, avatarUrl };
        }
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setBiometricLocked(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
      setBiometricLocked(false);
    } finally {
      setLoading(false);
    }
  };

  const unlockBiometric = async (): Promise<boolean> => {
    const success = await biometricService.authenticate('Unlock VaagBanda');
    if (success) {
      setBiometricLocked(false);
    }
    return success;
  };

  const enableBiometricLogin = async (): Promise<boolean> => {
    const enabled = await biometricService.enable();
    return enabled;
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, biometricLocked,
      refreshAuth, signOut, unlockBiometric, enableBiometricLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
