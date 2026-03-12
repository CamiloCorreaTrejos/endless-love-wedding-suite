
import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { Heart, Lock, Mail, Sparkles, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../src/lib/supabaseClient';
import { useWeddingData } from '../src/lib/WeddingDataContext';

export const Login: React.FC = () => {
  const { weddingData } = useWeddingData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);

 // const FALLBACK_URL = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop";

  const FALLBACK_URL = "https://odluvqpfwypkufkugoep.supabase.co/storage/v1/object/public/wedding-covers/ChatGPT%20Image%2023%20feb%202026,%2003_04_16%20p.m..png";

  useEffect(() => {
    const target = new Date(weddingData.date + 'T00:00:00');
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    setDaysLeft(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
  }, [weddingData.date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log("LOGIN_START");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        let message = authError.message;
        if (message === 'Invalid login credentials') message = 'Credenciales no válidas';
        setError(message);
      } else {
        console.log("LOGIN_OK");
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("SESSION_AFTER_LOGIN", sessionData?.session);
        console.log("USER_AFTER_LOGIN", sessionData?.session?.user);
        
        if (sessionData?.session) {
          console.log("NAVIGATE_DASHBOARD");
          // Nota: App.tsx reaccionará al cambio de estado de auth automáticamente
        } else {
          console.log("NO_SESSION_AFTER_LOGIN");
          setError("Login OK pero sin sesión activa. Revisa configuración del Auth Provider.");
        }
      }
      // Nota: onAuthStateChange en App.tsx manejará la redirección al detectar el login exitoso
    } catch (err) {
      console.error('Login Exception:', err);
      setError('Ocurrió un error inesperado al intentar acceder.');
    } finally {
      setIsLoading(false);
      console.log("LOGIN_FINALLY");
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white select-none">
      
      {/* Columna Izquierda: Fotografía Cinematográfica */}
      <div className="w-full md:w-1/2 h-[32vh] md:h-full relative overflow-hidden shrink-0">
        <img 
          src={weddingData.coverImageUrl || FALLBACK_URL} 
          alt={`${weddingData.partner1} & ${weddingData.partner2} Wedding`} 
          className="w-full h-full object-cover transition-transform duration-[15s] hover:scale-105 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_URL;
          }}
        />
        <div className="absolute inset-0 bg-[#0F1A2E]/5" />
        
        <div className="absolute bottom-10 left-10 hidden md:block animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <div className="flex items-center gap-3 text-white/80">
             <div className="w-8 h-px bg-white/30" />
             <span className="text-[9px] font-bold uppercase tracking-[0.4em] drop-shadow-sm">Endless Love Suite</span>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Panel de Acceso */}
      <div className="w-full md:w-1/2 flex-1 md:h-full flex items-center justify-center p-4 py-8 sm:p-6 md:p-12 lg:p-16 overflow-y-auto md:overflow-hidden relative" style={{ backgroundColor: COLORS.primary }}>
        
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")` }} />

        <div className="w-full max-w-[440px] bg-white/90 backdrop-blur-md rounded-[2rem] md:rounded-[3.5rem] p-6 sm:p-8 md:p-10 lg:p-14 shadow-[0_40px_100px_-20px_rgba(15,26,46,0.12)] border border-white relative z-10 animate-in fade-in zoom-in-95 duration-1000">
          
          <div className="flex flex-col items-center gap-6 md:gap-10 lg:gap-12">
            
            <div className="relative group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-stone-50 transition-transform duration-500 group-hover:scale-105">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-dashed border-[#C6A75E]/30 flex items-center justify-center flex-col">
                  <span className="text-lg md:text-xl font-bold text-[#0F1A2E] serif leading-none">
                    {weddingData.partner1[0]} & {weddingData.partner2[0]}
                  </span>
                  <Heart size={8} className="text-[#C6A75E] fill-[#C6A75E] mt-1" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-4 md:space-y-6">
              <div className="space-y-1 md:space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A2E] serif tracking-tight">
                  {weddingData.partner1} & {weddingData.partner2}
                </h2>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-[#C6A75E]">Nuestro Gran Día</p>
              </div>
              
              <p className="text-[10px] md:text-[11px] italic text-stone-500 serif px-2 md:px-4 opacity-70 leading-relaxed">
                “Este espacio guarda cada detalle de nuestra historia.”
              </p>
              
              <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-stone-50/50 border border-stone-100/80 rounded-full shadow-sm">
                <Calendar size={12} className="text-[#C6A75E] w-3 h-3 md:w-auto md:h-auto" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] md:text-xs font-bold text-[#0F1A2E] tabular-nums">{daysLeft}</span>
                  <span className="text-[7px] md:text-[8px] font-bold text-stone-400 uppercase tracking-widest">Días para el sí</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-6 md:space-y-10">
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-1.5 md:space-y-2 group/field">
                  <label className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1">Acceso Privado</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      placeholder="amor@nuestraboda.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-stone-50/50 border border-stone-100/50 rounded-xl md:rounded-2xl outline-none focus:border-[#C6A75E] focus:bg-white transition-all text-xs md:text-sm text-stone-800 font-medium shadow-inner"
                    />
                    <Mail size={16} className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within/field:text-[#C6A75E] transition-colors w-4 h-4 md:w-auto md:h-auto" />
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2 group/field">
                  <label className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1">Contraseña</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 md:pl-14 pr-4 md:pr-6 py-3.5 md:py-5 bg-stone-50/50 border border-stone-100/50 rounded-xl md:rounded-2xl outline-none focus:border-[#C6A75E] focus:bg-white transition-all text-xs md:text-sm text-stone-800 font-medium shadow-inner"
                    />
                    <Lock size={16} className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within/field:text-[#C6A75E] transition-colors w-4 h-4 md:w-auto md:h-auto" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full text-white font-bold py-4 md:py-6 rounded-[1.2rem] md:rounded-[1.8rem] shadow-2xl shadow-[#0F1A2E]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 md:gap-3 disabled:bg-stone-300 relative group overflow-hidden"
                  style={{ backgroundColor: COLORS.accent }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isLoading ? (
                    <span className="flex items-center gap-2 md:gap-3 uppercase tracking-[0.25em] text-[9px] md:text-[10px]">
                      Verificando... <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 md:gap-3 uppercase tracking-[0.25em] text-[9px] md:text-[10px]">
                      Entrar a nuestra historia <Sparkles size={14} className="text-[#C6A75E] w-3.5 h-3.5 md:w-auto md:h-auto" />
                    </span>
                  )}
                </button>

                {error && (
                  <div className="flex items-center justify-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300 text-center">
                    <AlertCircle size={12} className="shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </form>

            <div className="text-center space-y-3 opacity-60">
              <p className="text-[8px] uppercase tracking-[0.4em] font-bold text-stone-400">“Cada detalle cuenta.”</p>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[8px] text-stone-300 font-medium">
                  &copy; {new Date(weddingData.date).getFullYear()} {weddingData.partner1} & {weddingData.partner2} Wedding
                </p>
                <div className="w-1 h-1 rounded-full bg-[#C6A75E] opacity-40" />
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        body { overflow: hidden; }
        @media (max-width: 768px) {
          body { overflow: auto; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}} />
    </div>
  );
};
