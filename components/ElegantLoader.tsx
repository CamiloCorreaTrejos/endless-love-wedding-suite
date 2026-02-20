
import React from 'react';
import { Heart } from 'lucide-react';
import { COLORS } from '../constants';

export const ElegantLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[200]" style={{ backgroundColor: COLORS.primary }}>
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-stone-50 animate-pulse">
           <Heart className="text-[#C6A75E] fill-[#C6A75E]" size={32} />
        </div>
        <div className="absolute -inset-4 border border-dashed border-[#C6A75E]/30 rounded-full animate-[spin_10s_linear_infinite]" />
      </div>
      
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-[#0F1A2E] serif tracking-widest uppercase opacity-80">Endless Love</h2>
        <div className="w-48 h-px bg-stone-200 mx-auto relative overflow-hidden">
           <div className="absolute inset-0 bg-[#C6A75E] animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
        <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-stone-400">Preparando tu historia</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}} />
    </div>
  );
};
