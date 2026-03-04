
import React from 'react';
import { useNotifications } from '../src/contexts/NotificationsContext';
import { Bell, X, ExternalLink } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-stone-100 p-4 w-80 animate-in slide-in-from-right-4 duration-500 flex gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0F1A2E] flex items-center justify-center text-white shrink-0">
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-xs font-bold text-[#0F1A2E] serif truncate pr-2">
                {toast.notification.title}
              </h4>
              <button 
                onClick={() => dismissToast(toast.id)}
                className="text-stone-300 hover:text-stone-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-stone-500 line-clamp-2 mb-2">
              {toast.notification.message}
            </p>
            {toast.notification.link && (
              <a 
                href={toast.notification.link}
                className="text-[9px] font-bold text-[#C6A75E] uppercase tracking-widest flex items-center gap-1 hover:text-[#0F1A2E] transition-colors"
              >
                Ver detalle <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
