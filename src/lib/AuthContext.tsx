
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile } from '../../types';

interface AuthContextType {
  authUser: any | null;
  session: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (userId: string, email: string) => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email, role: 'admin', full_name: '' })
          .select()
          .single();
        if (insertError) throw insertError;
        profile = newProfile;
      }
      setUserProfile(profile as UserProfile);
      return profile as UserProfile;
    } catch (err) {
      console.error('[Profiles Sync Error]:', err);
      return null;
    }
  };

  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      if (initialSession?.user) {
        setAuthUser(initialSession.user);
        await fetchOrCreateProfile(initialSession.user.id, initialSession.user.email || '');
      }
      setLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("AUTH_STATE_CHANGE", event, !!currentSession);
      setSession(currentSession);
      if (currentSession?.user) {
        setAuthUser(currentSession.user);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await fetchOrCreateProfile(currentSession.user.id, currentSession.user.email || '');
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ authUser, session, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
