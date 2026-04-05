
import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { ICONS } from '../constants';
import { getWeddingAdvice, generateVisionImage } from '../services/gemini';
import { WeddingData } from '../types';

interface Message {
  role: 'user' | 'ai';
  content: string;
  sources?: any[];
  imageUrl?: string;
}

interface AIPlannerProps {
  data?: WeddingData;
}

export const AIPlanner: React.FC<AIPlannerProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "¡Hola! Soy tu asistente de Endless Love. ¿En qué puedo ayudarte a planear vuestro día perfecto? Puedo buscar lugares, sugerir temas o incluso visualizar vuestros arreglos florales." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      if (userMsg.toLowerCase().includes('muéstrame') || userMsg.toLowerCase().includes('genera') || userMsg.toLowerCase().includes('visualiza')) {
        const imageUrl = await generateVisionImage(userMsg);
        if (imageUrl) {
           setMessages(prev => [...prev, { role: 'ai', content: "Aquí tienes una visualización basada en tu petición:", imageUrl }]);
           setLoading(false);
           return;
        }
      }

      let contextString = '';
      if (data) {
        const totalBudget = data.budget;
        const totalSpent = data.expenses.reduce((acc, curr) => acc + curr.actual, 0);
        const totalPaid = data.vendors.reduce((acc, curr) => acc + curr.paidAmount, 0);
        const confirmedGuests = data.guests.filter(g => g.confirmation === 'si').reduce((acc, g) => acc + g.members.length, 0);
        const pendingTasks = data.tasks.filter(t => !t.completed).length;
        
        contextString = `
          Current Wedding Data:
          - Date: ${data.date}
          - Budget: $${totalBudget} (Spent: $${totalSpent}, Paid: $${totalPaid})
          - Confirmed Guests: ${confirmedGuests}
          - Pending Tasks: ${pendingTasks}
          - Vendors: ${data.vendors.length}
        `;
      }

      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await getWeddingAdvice(userMsg, contextString, chatHistory);
      setMessages(prev => [...prev, { role: 'ai', content: response.text || '', sources: response.sources }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Lo siento, tuve un problema. Por favor, inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[60vh] flex flex-col bg-white overflow-hidden">
      <div className="bg-stone-50 p-4 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white">
            {ICONS.AI}
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-sm">Consultor de Bodas IA</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase">En línea</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-rose-500 text-white rounded-tr-none' 
                : 'bg-stone-100 text-stone-700 rounded-tl-none border border-stone-100'
            }`}>
              <div className="markdown-body">
                <Markdown>{m.content}</Markdown>
              </div>
              {m.imageUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border-2 border-white shadow-md">
                   <img src={m.imageUrl} alt="IA Visión" className="w-full h-auto" />
                </div>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-stone-200/20">
                  <p className="text-[10px] uppercase font-bold text-stone-400 mb-2">Fuentes Encontradas</p>
                  <div className="flex flex-wrap gap-2">
                    {m.sources.map((src: any, idx: number) => (
                      <a key={idx} href={src.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white/50 px-2 py-1 rounded hover:bg-white/80 text-rose-600 truncate max-w-[150px]">
                        {src.web?.title || 'Enlace'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-stone-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pídeme ideas, busca tendencias o di 'Visualiza un tema boho'..."
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-5 py-3.5 pr-14 text-sm outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300 transition-all text-stone-800"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:bg-stone-300 transition-all shadow-md active:scale-95"
          >
            {ICONS.Send}
          </button>
        </div>
        <p className="text-[10px] text-stone-400 mt-2 text-center italic">
          Consejos generados por IA. Verifica la disponibilidad local de los proveedores.
        </p>
      </div>
    </div>
  );
};
