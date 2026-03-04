
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile } from '../../types';

interface AuthContextType {
  authUser: any | null;
  session: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  retryBootstrap: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const bootstrappedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(true);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const loadProfile = async (userId: string, email: string) => {
    console.log('AUTH_PROFILE_START', userId);
    
    // Safety timeout for profile load: 6 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile load timeout')), 6000)
    );

    try {
      console.log('AUTH_PROFILE_QUERY_INIT');
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('AUTH_PROFILE_AWAITING_RES');
      const { data: profile, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      console.log('AUTH_PROFILE_RES_RECEIVED', { hasData: !!profile, hasError: !!error });

      if (error) {
        console.error('AUTH_PROFILE_ERROR (Fetch):', error);
        throw error;
      }

      if (!profile) {
        console.log('AUTH_PROFILE_NOT_FOUND, creating...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email, role: 'admin', full_name: '' })
          .select()
          .single();
        
        if (insertError) {
          console.error('AUTH_PROFILE_ERROR (Insert):', insertError);
          throw insertError;
        }
        console.log('AUTH_PROFILE_CREATED', newProfile?.id);
        setUserProfile(newProfile as UserProfile);
        return newProfile as UserProfile;
      }
      
      console.log('AUTH_PROFILE_OK', profile?.id);
      setUserProfile(profile as UserProfile);
      return profile as UserProfile;
    } catch (err) {
      console.error('AUTH_PROFILE_ERROR (Critical):', err);
      
      // Resilient Fallback
      const fallbackProfile: UserProfile = {
        id: userId,
        email: email,
        role: 'admin',
        full_name: 'Usuario (Modo Resiliente)',
        wedding_id: '00000000-0000-0000-0000-000000000000'
      };
      
      console.warn('AUTH_PROFILE_FALLBACK_USED');
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  const bootstrap = async () => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    console.log('AUTH_BOOT_START');
    setLoading(true);
    setAuthError(null);

    // Safety timeout: 10 seconds
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (loadingRef.current) {
        console.warn('AUTH_BOOT_TIMEOUT - Forcing loading end');
        setLoading(false);
        // If we timed out but have a user, we might still be able to show something
        if (!authUser) {
          setAuthError("La conexión está tardando más de lo esperado. Por favor, recarga o intenta más tarde.");
        }
      }
    }, 10000);

    try {
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('AUTH_BOOT_SESSION_ERROR', sessionError);
        throw sessionError;
      }

      if (initialSession?.user) {
        console.log('AUTH_BOOT_SESSION_OK', initialSession.user.id);
        setSession(initialSession);
        setAuthUser(initialSession.user);
        await loadProfile(initialSession.user.id, initialSession.user.email || '');
      } else {
        console.log('AUTH_BOOT_NO_SESSION');
        setSession(null);
        setAuthUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('AUTH_BOOT_CRITICAL_ERROR', err);
      setAuthError("Error crítico al iniciar sesión.");
    } finally {
      console.log('AUTH_LOADING_END');
      setLoading(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("AUTH_EVENT", event, !!currentSession);
      
      setSession(currentSession);
      
      if (currentSession?.user) {
        setAuthUser(currentSession.user);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          await loadProfile(currentSession.user.id, currentSession.user.email || '');
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    });

    // Cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('endless-love-auth')) {
        console.log('AUTH_STORAGE_SYNC_TRIGGERED');
        bootstrappedRef.current = false;
        bootstrap();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const retryBootstrap = () => {
    bootstrappedRef.current = false;
    bootstrap();
  };

  return (
    <AuthContext.Provider value={{ authUser, session, userProfile, loading, authError, signOut, retryBootstrap }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
