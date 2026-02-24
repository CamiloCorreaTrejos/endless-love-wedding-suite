import { createClient } from "@supabase/supabase-js";

/**
 * Singleton de Supabase para toda la aplicación.
 */

const getEnv = (key: string) => {
  // Check window.__ENV__ first (runtime injection)
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    return (window as any).__ENV__[key];
  }
  // Fallback to import.meta.env (build-time or .env file)
  const metaVal = (import.meta as any).env[key];
  if (metaVal) return metaVal;
  
  // Fallback to process.env
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key];
  }
  
  return null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials missing. Check window.__ENV__ or .env file.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'endless-love-auth'
    }
  }
);
