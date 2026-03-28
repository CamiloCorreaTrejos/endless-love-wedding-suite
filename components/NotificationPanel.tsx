
import React from 'react';
import { useNotifications } from '../src/contexts/NotificationsContext';
import { Bell, Check, CheckCheck, ExternalLink, Clock, AlertCircle, Info, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationPanelProps {
  onClose: () => void;
  weddingId: string;
  userId?: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose, weddingId, userId }) => {
  const { notifications, markRead, markAllRead, loading } = useNotifications();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent': return <Zap size={14} className="text-rose-500" />;
      case 'warning': return <AlertCircle size={14} className="text-amber-500" />;
      case 'info': return <Info size={14} className="text-blue-500" />;
      default: return <Bell size={14} className="text-stone-400" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'bg-rose-50';
      case 'warning': return 'bg-amber-50';
      case 'info': return 'bg-blue-50';
      default: return 'bg-stone-50';
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-300">
      <div className="p-6 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
        <div>
          <h3 className="text-lg font-bold text-[#0F1A2E] serif">Notificaciones</h3>
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Centro de Actualizaciones</p>
        </div>
        <button 
          onClick={() => markAllRead(weddingId, userId)}
          className="flex items-center gap-1.5 text-[9px] font-bold text-[#C6A75E] uppercase tracking-widest hover:text-[#0F1A2E] transition-colors"
        >
          <CheckCheck size={14} />
          Marcar todas
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="mx-auto text-stone-200 animate-spin mb-3" size={24} />
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cargando...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-stone-50">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-5 transition-all hover:bg-stone-50 relative group ${!n.isRead ? 'bg-white' : 'bg-white/50'}`}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C6A75E]" />
                )}
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getSeverityBg(n.severity)}`}>
                    {getSeverityIcon(n.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-xs font-bold serif truncate ${!n.isRead ? 'text-[#0F1A2E]' : 'text-stone-500'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[8px] font-bold text-stone-300 uppercase tracking-tighter whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className={`text-[10px] leading-relaxed mb-3 ${!n.isRead ? 'text-stone-600' : 'text-stone-400'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between">
                      {n.link ? (
                        <a 
                          href={n.link}
                          onClick={onClose}
                          className="text-[9px] font-bold text-[#C6A75E] uppercase tracking-widest flex items-center gap-1 hover:text-[#0F1A2E] transition-colors"
                        >
                          Ver <ExternalLink size={10} />
                        </a>
                      ) : <div />}
                      
                      {!n.isRead && (
                        <button 
                          onClick={() => markRead(n.id, weddingId)}
                          className="p-1.5 bg-stone-50 text-stone-400 rounded-lg hover:bg-emerald-50 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
                          title="Marcar como leída"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={20} className="text-stone-200" />
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No hay notificaciones</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-stone-50 border-t border-stone-100 text-center">
        <button 
          onClick={() => {
            // Navigate to notifications page
            window.location.href = '/?section=notificaciones';
            onClose();
          }}
          className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] hover:text-[#0F1A2E] transition-colors"
        >
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  );
};
