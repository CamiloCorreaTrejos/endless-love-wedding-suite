
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Heart, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  Check,
  Utensils,
  MessageSquare
} from 'lucide-react';
import { getGuestByRsvpCode, submitRsvpResponse } from '../services/supabase';

interface PublicRsvpProps {
  code: string;
}

export const PublicRsvp: React.FC<PublicRsvpProps> = ({ code }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guest, setGuest] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);

  useEffect(() => {
    const fetchGuest = async () => {
      setLoading(true);
      const { data, error } = await getGuestByRsvpCode(code);
      if (error || !data) {
        setError("Lo sentimos, no pudimos encontrar tu invitación. Por favor verifica el código.");
      } else if (data.rsvpClosed) {
        setError("Esta invitación ya ha sido cerrada. Si necesitas hacer cambios, contacta a los novios.");
      } else {
        setGuest(data);
        setResponses(data.members.map((m: any) => ({
          id: m.id,
          name: m.name,
          attending: m.attending ?? null,
          dietaryRestrictions: m.dietaryRestrictions || '',
          rsvpNotes: m.rsvpNotes || ''
        })));
      }
      setLoading(false);
    };

    if (code) fetchGuest();
  }, [code]);

  const handleResponseChange = (idx: number, field: string, value: any) => {
    const newResponses = [...responses];
    newResponses[idx] = { ...newResponses[idx], [field]: value };
    setResponses(newResponses);
  };

  const handleSubmit = async () => {
    if (!guest) return;
    
    const hasUnanswered = responses.some(r => r.attending === null);
    if (hasUnanswered) {
      alert("Por favor responde por todos los invitados.");
      return;
    }

    setSubmitting(true);
    
    const attendingCount = responses.filter(r => r.attending === true).length;
    const rsvpStatus = attendingCount === responses.length ? 'confirmado' : 
                      attendingCount === 0 ? 'rechazado' : 'parcial';

    const { error } = await submitRsvpResponse(guest.id, responses, rsvpStatus);
    
    if (!error) {
      setSubmitted(true);
    } else {
      alert("Hubo un error al enviar tu respuesta. Por favor intenta de nuevo.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 animate-bounce">
          <Heart className="text-[#0F1A2E]" fill="#0F1A2E" size={24} />
        </div>
        <p className="text-[#0F1A2E] serif text-lg animate-pulse">Cargando tu invitación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-stone-100">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F1A2E] serif mb-4">¡Ups!</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-[#0F1A2E] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-[#0F1A2E] serif mb-4">¡Gracias por confirmar!</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            Tu respuesta ha sido registrada correctamente. Estamos muy emocionados de compartir este día tan especial contigo.
          </p>
          <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 text-left mb-8">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Resumen de asistencia</p>
            {responses.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <span className="text-sm font-medium text-stone-700">{r.name}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${r.attending ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {r.attending ? 'Asiste' : 'No Asiste'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-stone-400 italic text-sm">¡Nos vemos pronto!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Heart className="text-[#0F1A2E]" fill="#0F1A2E" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-[#0F1A2E] serif mb-4">Nuestra Boda</h1>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.3em]">Confirmación de Asistencia</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-stone-100 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="p-10 md:p-16">
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[#0F1A2E] serif mb-2">Hola, {guest.groupName}</h2>
              <p className="text-stone-500 leading-relaxed">
                Por favor, confírmanos tu asistencia y la de tus acompañantes antes de la fecha límite. 
                Tu presencia es el mejor regalo que podemos recibir.
              </p>
            </div>

            <div className="space-y-8">
              {responses.map((response, idx) => (
                <div key={response.id} className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-6 transition-all hover:shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xs font-bold text-[#0F1A2E] shadow-sm">
                        {idx + 1}
                      </div>
                      <span className="text-lg font-bold text-[#0F1A2E] serif">{response.name}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleResponseChange(idx, 'attending', true)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          response.attending === true 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-white text-stone-400 border border-stone-100 hover:border-emerald-200'
                        }`}
                      >
                        <Check size={14} />
                        Asistiré
                      </button>
                      <button 
                        onClick={() => handleResponseChange(idx, 'attending', false)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          response.attending === false 
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-white text-stone-400 border border-stone-100 hover:border-rose-200'
                        }`}
                      >
                        <XCircle size={14} />
                        No asistiré
                      </button>
                    </div>
                  </div>

                  {response.attending === true && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                          <Utensils size={12} />
                          Restricciones Alimenticias
                        </label>
                        <input 
                          type="text" 
                          placeholder="Ej: Alergia a nueces, Vegano..."
                          value={response.dietaryRestrictions}
                          onChange={(e) => handleResponseChange(idx, 'dietaryRestrictions', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-stone-100 rounded-xl text-xs focus:ring-2 focus:ring-[#C6A75E]/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                          <MessageSquare size={12} />
                          Notas adicionales
                        </label>
                        <input 
                          type="text" 
                          placeholder="Algún mensaje para los novios..."
                          value={response.rsvpNotes}
                          onChange={(e) => handleResponseChange(idx, 'rsvpNotes', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-stone-100 rounded-xl text-xs focus:ring-2 focus:ring-[#C6A75E]/20 transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 pt-12 border-t border-stone-50">
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-5 bg-[#0F1A2E] text-white rounded-[1.5rem] text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-2xl shadow-[#0F1A2E]/20 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Enviando respuesta...
                  </>
                ) : (
                  <>
                    Enviar Confirmación
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              <p className="text-center text-[9px] text-stone-300 font-bold uppercase tracking-widest mt-6">
                Al enviar, confirmas que la información es correcta
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center">
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Endless Love Wedding Planner</p>
        </footer>
      </div>
    </div>
  );
};
