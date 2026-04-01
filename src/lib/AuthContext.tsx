
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile } from '../../types';

interface AuthContextType {
  authUser: any | null;
  session: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  profileLoading: boolean;
  profileWarning: string | null;
  signOut: () => Promise<void>;
  retryBootstrap: () => void;
  retryProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileWarning, setProfileWarning] = useState<string | null>(null);
  const [profileRetryCount, setProfileRetryCount] = useState(0);

  const bootstrappedRef = useRef(false);
  const profileRequestRef = useRef<Promise<any> | null>(null);
  const lastProfileLoadedUserIdRef = useRef<string | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadProfile = async (userId: string, email: string, isInitialBootstrap: boolean = false) => {
    if (profileRequestRef.current) {
      return profileRequestRef.current;
    }

    console.log('AUTH_PROFILE_QUERY_START', userId);
    setProfileLoading(true);

    const promise = (async () => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 8000)
      );

      try {
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const { data: profile, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

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
          console.log('AUTH_PROFILE_OK (Created)', newProfile?.id);
          setUserProfile(newProfile as UserProfile);
          lastProfileLoadedUserIdRef.current = userId;
          setProfileWarning(null);
          setProfileRetryCount(0);
          return newProfile as UserProfile;
        }
        
        console.log('AUTH_PROFILE_OK', profile?.id);
        setUserProfile(profile as UserProfile);
        lastProfileLoadedUserIdRef.current = userId;
        setProfileWarning(null);
        setProfileRetryCount(0);
        return profile as UserProfile;
      } catch (err: any) {
        if (err.message === 'Profile load timeout') {
          console.error('AUTH_PROFILE_TIMEOUT');
        } else {
          console.error('AUTH_PROFILE_ERROR:', err);
        }

        if (isInitialBootstrap && !userProfile) {
          console.error('AUTH_FATAL_PROFILE_ERROR');
          setAuthError("No se pudo cargar el perfil. Por favor, recarga la página.");
        } else {
          console.warn('AUTH_PROFILE_NON_FATAL_ERROR');
          console.log('AUTH_SESSION_STILL_VALID');
          setProfileWarning("Estamos reintentando sincronizar tu perfil...");
        }
        throw err;
      } finally {
        profileRequestRef.current = null;
        setProfileLoading(false);
      }
    })();

    profileRequestRef.current = promise;
    return promise;
  };

  const refreshProfileSilently = async (userId: string, email: string, retryCount = 0) => {
    try {
      await loadProfile(userId, email, false);
    } catch (err) {
      if (retryCount < 3) {
        const delays = [2000, 5000, 10000];
        const delay = delays[retryCount];
        console.log('AUTH_PROFILE_RETRY_SCHEDULED', { delay, retryCount: retryCount + 1 });
        
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        
        retryTimerRef.current = setTimeout(() => {
          console.log('AUTH_PROFILE_RETRY_START', { retryCount: retryCount + 1 });
          setProfileRetryCount(retryCount + 1);
          refreshProfileSilently(userId, email, retryCount + 1);
        }, delay);
      } else {
        console.log('AUTH_PROFILE_NON_FATAL_ERROR: Max retries reached');
      }
    }
  };

  const bootstrap = async () => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    console.log('AUTH_BOOT_START');
    setLoading(true);
    setAuthError(null);

    try {
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        if (sessionError.message?.includes('Refresh Token') || sessionError.message?.includes('refresh_token')) {
          console.warn('AUTH_BOOT_SESSION_EXPIRED', sessionError);
          await supabase.auth.signOut();
          setSession(null);
          setAuthUser(null);
          setUserProfile(null);
        } else {
          console.error('AUTH_BOOT_SESSION_ERROR', sessionError);
          throw sessionError;
        }
      } else if (initialSession?.user) {
        console.log('AUTH_BOOT_SESSION_OK', initialSession.user.id);
        setSession(initialSession);
        setAuthUser(initialSession.user);
        try {
          await loadProfile(initialSession.user.id, initialSession.user.email || '', true);
        } catch (e) {
          // Error handled inside loadProfile
        }
      } else {
        console.log('AUTH_BOOT_NO_SESSION');
        setSession(null);
        setAuthUser(null);
        setUserProfile(null);
      }
    } catch (err: any) {
      if (err?.message?.includes('Refresh Token') || err?.message?.includes('refresh_token')) {
        console.warn('AUTH_BOOT_SESSION_EXPIRED_CATCH', err);
        await supabase.auth.signOut();
        setSession(null);
        setAuthUser(null);
        setUserProfile(null);
      } else {
        console.error('AUTH_BOOT_CRITICAL_ERROR', err);
        setAuthError("Error crítico al iniciar sesión.");
        setUserProfile(null);
      }
    } finally {
      console.log('AUTH_LOADING_END');
      setLoading(false);
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
          if (lastProfileLoadedUserIdRef.current !== currentSession.user.id || event === 'TOKEN_REFRESHED') {
            refreshProfileSilently(currentSession.user.id, currentSession.user.email || '', 0);
          }
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
        lastProfileLoadedUserIdRef.current = null;
        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const retryBootstrap = () => {
    bootstrappedRef.current = false;
    bootstrap();
  };

  const retryProfile = () => {
    if (authUser) {
      refreshProfileSilently(authUser.id, authUser.email || '', 0);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      authUser, session, userProfile, loading, authError, 
      profileLoading, profileWarning, signOut, retryBootstrap, retryProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
