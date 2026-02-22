import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-[92%] max-w-[720px] max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 sm:px-8 sm:py-6 border-b border-stone-100 bg-stone-50/50 shrink-0">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 serif">{title}</h3>
            {subtitle && (
              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-3 bg-white hover:bg-stone-100 text-stone-400 rounded-2xl shadow-sm transition-all hover:text-stone-600"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};
