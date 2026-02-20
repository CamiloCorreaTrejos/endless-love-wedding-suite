
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client initialization.
 * Following the environment's standard, we prioritize process.env for configuration.
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

// Initialize the client only if the required configuration is present.
// This prevents the application from crashing if the keys are not yet configured.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Helper to check if Supabase services are ready to be used.
 */
export const isSupabaseConfigured = () => !!supabase;
