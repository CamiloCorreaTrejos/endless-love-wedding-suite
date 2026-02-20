import { createClient } from "@supabase/supabase-js";

/**
 * Sistema de resolución de variables de entorno para Supabase.
 * Prioriza la inyección manual via window.__ENV__ sobre el sistema de archivos .env.
 */

const getEnv = (key) => {
  // 1. Prioridad: window.__ENV__ (Inyección runtime manual)
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return { value: window.__ENV__[key], source: 'window.__ENV__' };
  }

  // 2. Fallback: import.meta.env (Estándar Vite / .env file)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return { value: import.meta.env[key], source: 'import.meta.env' };
    }
  } catch (e) {}

  // 3. Fallback: process.env (Node/Webpack)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return { value: process.env[key], source: 'process.env' };
    }
  } catch (e) {}

  return { value: null, source: 'none' };
};

const urlRes = getEnv('VITE_SUPABASE_URL');
const keyRes = getEnv('VITE_SUPABASE_ANON_KEY');

const supabaseUrl = urlRes.value;
const supabaseAnonKey = keyRes.value;

// Debugging de configuración
console.group("Supabase Environment Status");
console.log(`URL Origin: ${urlRes.source} ${supabaseUrl ? `(OK: ${supabaseUrl.substring(0, 10)}...)` : '(Missing)'}`);
console.log(`Key Origin: ${keyRes.source} ${supabaseAnonKey ? `(OK: ${supabaseAnonKey.substring(0, 10)}...)` : '(Missing)'}`);
console.groupEnd();

// Exportación del cliente
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        // Fix: Added getSession and signOut to mock object to resolve missing property errors in App.tsx
        signInWithPassword: async () => {
          console.error("Supabase Error: No se han proporcionado credenciales válidas en window.__ENV__ ni en el entorno.");
          return { 
            data: { user: null }, 
            error: { message: "Error crítico: Credenciales de base de datos no configuradas en el host." } 
          };
        },
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      // Added missing methods (maybeSingle, insert) to satisfy usage in Login.tsx
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ 
              data: null, 
              error: { message: "Supabase not configured", code: 'PGRST116' } 
            }),
            maybeSingle: async () => ({ 
              data: null, 
              error: { message: "Supabase not configured", code: 'PGRST116' } 
            })
          }),
          single: async () => ({ 
            data: null, 
            error: { message: "Supabase not configured", code: 'PGRST116' } 
          }),
          maybeSingle: async () => ({ 
            data: null, 
            error: { message: "Supabase not configured", code: 'PGRST116' } 
          })
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ 
              data: null, 
              error: { message: "Supabase not configured", code: '42501' } 
            }),
            maybeSingle: async () => ({ 
              data: null, 
              error: { message: "Supabase not configured", code: '42501' } 
            })
          }),
          single: async () => ({ 
            data: null, 
            error: { message: "Supabase not configured", code: '42501' } 
          })
        }),
        upsert: () => ({
          select: () => ({
            single: async () => ({ 
              data: null, 
              error: { message: "Supabase not configured", code: '42501' } 
            })
          })
        })
      })
    };

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ CONFIGURACIÓN MANUAL REQUERIDA: Define window.__ENV__.VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY " +
    "en index.html para habilitar la conexión con Supabase."
  );
}