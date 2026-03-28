
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../src/contexts/NotificationsContext';
import { useAuth } from '../src/lib/AuthContext';
import { 
  Bell, 
  CheckCheck, 
  Filter, 
  Settings, 
  Smartphone, 
  BellOff, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Info, 
  Clock,
  Plus,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { isPushSupported, requestNotificationPermission, getFcmToken } from '../src/lib/push';
import { createNotification, upsertNotificationToken } from '../services/supabase';

export const NotificationsPage: React.FC = () => {
  const { notifications, markRead, markAllRead, loading, refetch } = useNotifications();
  const { userProfile } = useAuth();
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [isActivating, setIsActivating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const weddingId = userProfile?.wedding_id || '';
  const userId = userProfile?.id;

  useEffect(() => {
    if (!isPushSupported()) {
      setPushStatus('unsupported');
    } else {
      setPushStatus(Notification.permission as any);
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      await requestNotificationPermission();
      setPushStatus('granted');
      setSuccessMessage("Permiso concedido");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSyncToken = async () => {
    if (!weddingId || !userId) return;
    setIsActivating(true);
    setSuccessMessage(null);
    try {
      console.log('FCM_SYNC_START');
      const token = await getFcmToken();
      if (token) {
        console.log('SAVE_PUSH_TOKEN_START');
        const { error } = await upsertNotificationToken(token, weddingId, userId);
        if (error) throw error;
        console.log('SAVE_PUSH_TOKEN_OK');
        setPushStatus('granted');
        setSuccessMessage("Token sincronizado correctamente");
      } else {
        throw new Error("No se pudo obtener el token. Asegúrate de haber dado permisos y que el navegador sea compatible.");
      }
    } catch (err: any) {
      console.error('SAVE_PUSH_TOKEN_ERROR', err);
      alert(err.message);
    } finally {
      setIsActivating(false);
    }
  };

  const handleCreateTestNotif = async () => {
    if (!weddingId) return;
    const types = ['task_due', 'vendor_due', 'budget_alert', 'general'];
    const severities = ['info', 'warning', 'urgent'];
    
    await createNotification({
      weddingId,
      userId: userId || null,
      title: 'Notificación de Prueba',
      message: 'Esta es una notificación generada manualmente para probar la interfaz.',
      type: types[Math.floor(Math.random() * types.length)] as any,
      severity: severities[Math.floor(Math.random() * severities.length)] as any,
      link: '/?section=dashboard'
    }, weddingId);
    
    refetch(weddingId, userId);
  };

  const filteredNotifs = notifications.filter(n => {
    const matchesType = filter === 'all' || n.type === filter;
    const matchesSeverity = severityFilter === 'all' || n.severity === severityFilter;
    return matchesType && matchesSeverity;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent': return <Zap size={16} className="text-rose-500" />;
      case 'warning': return <AlertCircle size={16} className="text-amber-500" />;
      case 'info': return <Info size={16} className="text-blue-500" />;
      default: return <Bell size={16} className="text-stone-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#0F1A2E] serif mb-2">Notificaciones</h2>
          <p className="text-stone-400 text-xs font-medium uppercase tracking-[0.2em]">Gestiona tus alertas y actualizaciones</p>
        </div>
        <div className="flex gap-3">
          {import.meta.env.DEV && (
            <button 
              onClick={handleCreateTestNotif}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-2xl text-[10px] font-bold text-stone-600 uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm"
            >
              <Plus size={14} />
              Prueba UI
            </button>
          )}
          <button 
            onClick={() => markAllRead(weddingId, userId)}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F1A2E] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg shadow-[#0F1A2E]/20"
          >
            <CheckCheck size={14} />
            Marcar todas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-stone-50 rounded-xl text-stone-400">
                <Settings size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#0F1A2E] uppercase tracking-widest">Ajustes de Notificaciones</h3>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone size={18} className="text-stone-400" />
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Notificaciones Push</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Estado</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${
                      pushStatus === 'granted' ? 'text-emerald-500' : 
                      pushStatus === 'denied' ? 'text-rose-500' : 'text-amber-500'
                    }`}>
                      {pushStatus === 'granted' ? 'Activado' : 
                       pushStatus === 'denied' ? 'Bloqueado' : 
                       pushStatus === 'unsupported' ? 'No Soportado' : 'Pendiente'}
                    </span>
                  </div>

                  {successMessage && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">{successMessage}</p>
                    </div>
                  )}

                  {(pushStatus === 'default' || pushStatus === 'denied') && (
                    <button 
                      onClick={handleRequestPermission}
                      className="w-full py-3 bg-white border border-stone-200 rounded-xl text-[9px] font-bold text-stone-600 uppercase tracking-widest hover:bg-stone-100 transition-all"
                    >
                      Activar Notificaciones
                    </button>
                  )}

                  {pushStatus === 'granted' && (
                    <button 
                      onClick={handleSyncToken}
                      disabled={isActivating}
                      className={`w-full py-3 bg-[#0F1A2E] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg shadow-[#0F1A2E]/10 ${isActivating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isActivating ? 'Sincronizando...' : 'Sincronizar Token'}
                    </button>
                  )}

                  {pushStatus === 'granted' && !successMessage && (
                    <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={12} className="text-emerald-500 mt-0.5" />
                      <p className="text-[9px] text-emerald-700 leading-relaxed">
                        Permiso otorgado. Las notificaciones push están listas para recibir alertas.
                      </p>
                    </div>
                  )}

                  {pushStatus === 'denied' && (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <BellOff size={12} className="text-rose-500 mt-0.5" />
                      <p className="text-[9px] text-rose-700 leading-relaxed">
                        Has bloqueado las notificaciones. Actívalas en la configuración de tu navegador.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Filtrar por Tipo</label>
                  <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl text-xs font-bold text-stone-600 focus:ring-2 focus:ring-[#C6A75E]/20 transition-all"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="task_due">Tareas</option>
                    <option value="vendor_due">Proveedores</option>
                    <option value="budget_alert">Presupuesto</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Filtrar por Severidad</label>
                  <select 
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl text-xs font-bold text-stone-600 focus:ring-2 focus:ring-[#C6A75E]/20 transition-all"
                  >
                    <option value="all">Todas las severidades</option>
                    <option value="info">Información</option>
                    <option value="warning">Advertencia</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {loading && notifications.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-stone-100 rounded-3xl animate-pulse" />
            ))
          ) : filteredNotifs.length > 0 ? (
            filteredNotifs.map((n) => (
              <div 
                key={n.id} 
                className={`bg-white p-6 rounded-[2rem] border transition-all hover:shadow-md relative group ${
                  !n.isRead ? 'border-[#C6A75E]/30' : 'border-stone-100 opacity-80'
                }`}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#C6A75E] rounded-r-full" />
                )}
                <div className="flex gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    n.severity === 'urgent' ? 'bg-rose-50' : 
                    n.severity === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
                  }`}>
                    {getSeverityIcon(n.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className={`text-lg font-bold serif mb-1 ${!n.isRead ? 'text-[#0F1A2E]' : 'text-stone-500'}`}>
                          {n.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            {format(new Date(n.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
                          </span>
                          <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            n.type.includes('task') ? 'bg-stone-100 text-stone-500' :
                            n.type.includes('vendor') ? 'bg-indigo-50 text-indigo-500' :
                            n.type === 'budget_alert' ? 'bg-emerald-50 text-emerald-500' :
                            n.type === 'rsvp_update' ? 'bg-rose-50 text-rose-500' : 'bg-stone-50 text-stone-400'
                          }`}>
                            {n.type}
                          </span>
                        </div>
                      </div>
                      {!n.isRead && (
                        <button 
                          onClick={() => markRead(n.id, weddingId)}
                          className="p-2 bg-stone-50 text-stone-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                          title="Marcar como leída"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed mb-4 ${!n.isRead ? 'text-stone-600' : 'text-stone-400'}`}>
                      {n.message}
                    </p>
                    {n.link && (
                      <a 
                        href={n.link}
                        className="inline-flex items-center gap-2 text-[10px] font-bold text-[#C6A75E] uppercase tracking-widest hover:text-[#0F1A2E] transition-colors"
                      >
                        Ver detalle
                        <ChevronRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white py-20 rounded-[3rem] border border-stone-100 text-center">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell size={32} className="text-stone-200" />
              </div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">No hay notificaciones para mostrar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
