
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
      console.log('[Auth] Fetching profile for:', userId);
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Profiles Fetch Error]:', error);
        throw error;
      }

      if (!profile) {
        console.log('[Auth] Profile not found, creating...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email, role: 'admin', full_name: '' })
          .select()
          .single();
        if (insertError) {
          console.error('[Profiles Insert Error]:', insertError);
          throw insertError;
        }
        profile = newProfile;
      }
      
      console.log('[Auth] Profile synced:', profile?.id);
      setUserProfile(profile as UserProfile);
      return profile as UserProfile;
    } catch (err) {
      console.error('[Profiles Sync Critical Error]:', err);
      
      // Resilient Fallback: If DB is unreachable or schema is missing, 
      // provide a local "Demo" profile so the user can at least see the app.
      const fallbackProfile: UserProfile = {
        id: userId,
        email: email,
        role: 'admin',
        full_name: 'Usuario (Modo Resiliente)',
        wedding_id: '00000000-0000-0000-0000-000000000000' // Placeholder UUID
      };
      
      console.warn('[Auth] Using fallback profile due to database error.');
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        setLoading(true);
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            setAuthUser(initialSession.user);
            await fetchOrCreateProfile(initialSession.user.id, initialSession.user.email || '');
          } else {
            setAuthUser(null);
            setUserProfile(null);
          }
        }
      } catch (err) {
        console.error('[Auth Init Error]:', err);
        if (mounted) {
          setAuthUser(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("AUTH_STATE_CHANGE", event, !!currentSession);
      
      if (!mounted) return;

      try {
        setSession(currentSession);
        
        if (currentSession?.user) {
          setAuthUser(currentSession.user);
          
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            await fetchOrCreateProfile(currentSession.user.id, currentSession.user.email || '');
          }
        } else {
          setAuthUser(null);
          setUserProfile(null);
          if (event === 'SIGNED_OUT') {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('[Auth State Change Error]:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
