import React, { useState, useMemo } from 'react';
import { ICONS, COLORS } from '../constants';
import { WeddingData } from '../types';
import { useNotifications } from '../src/contexts/NotificationsContext';
import { useAuth } from '../src/lib/AuthContext';
import { NotificationPanel } from './NotificationPanel';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronRight as ChevronIcon,
  Circle,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  LayoutGrid,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Bell
} from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  data: WeddingData; // Recibimos la data para hacer el sidebar inteligente
}

export const resolveNotificationTarget = (link: string): string => {
  console.log("NOTIF_LINK_RAW", { link });
  
  if (!link) return 'notifications';

  const normalizedLink = link.toLowerCase().trim();
  console.log("NOTIF_LINK_NORMALIZED", { normalizedLink });

  // Extract path and query params
  let path = '';
  let sectionParam = '';

  try {
    // Handle relative links by prepending a dummy origin
    const url = new URL(normalizedLink, 'http://dummy.com');
    path = url.pathname.replace(/^\/+|\/+$/g, ''); // remove leading/trailing slashes
    sectionParam = url.searchParams.get('section') || '';
  } catch (e) {
    // Fallback if URL parsing fails
    path = normalizedLink.replace(/^\/+|\/+$/g, '');
  }

  // Check what we have
  const target = sectionParam || path;

  const sectionMap: Record<string, string> = {
    'tasks': 'tasks',
    'tareas': 'tasks',
    
    'rsvp': 'rsvp',
    'confirmaciones': 'rsvp',
    
    'vendors': 'vendors',
    'proveedores': 'vendors',
    
    'budget': 'budget',
    'presupuesto': 'budget',
    
    'guests': 'guests',
    'invitados': 'guests',
    
    'seating': 'seating',
    'plano-de-mesas': 'seating',
    
    'dashboard': 'dashboard',
    
    'notifications': 'notifications',
    'notificaciones': 'notifications'
  };

  const resolvedTab = sectionMap[target] || 'notifications';
  console.log("NOTIF_ACTIVE_TAB_RESOLVED", { resolvedTab, target });
  
  return resolvedTab;
};

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, onLogout, children, data }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);

  const { unreadCount } = useNotifications();
  const { userProfile } = useAuth();

  const handleNavigate = (link: string) => {
    try {
      const activeTabId = resolveNotificationTarget(link);
      
      if (activeTabId) {
        console.log("NOTIF_NAVIGATE_TO_TAB", { activeTabId });
        setActiveTab(activeTabId);
        // Update URL to match the new tab
        const newUrl = activeTabId === 'dashboard' ? '/' : `/?section=${activeTabId}`;
        window.history.pushState({}, '', newUrl);
      } else {
        console.log("NOTIF_NAVIGATE_FALLBACK", { link });
        setActiveTab('notifications');
        window.history.pushState({}, '', '/?section=notifications');
      }
    } catch (e) {
      console.log("NOTIF_NAVIGATE_FALLBACK", { link });
      setActiveTab('notifications');
      window.history.pushState({}, '', '/?section=notifications');
    }
  };

  const effectiveCollapsed = isCollapsed;

  // Cálculos inteligentes para indicadores dinámicos
  const sidebarMetrics = useMemo(() => {
    // Tareas
    const activeTasks = data.tasks.filter(t => !t.completed).length;
    const urgentTasks = data.tasks.filter(t => !t.completed && t.priority === 'High').length;
    
    // Invitados
    const allMembers = data.guests.flatMap(g => g.members);
    const pendingRSVP = data.guests.filter(g => g.rsvpStatus === 'pendiente' || g.rsvpStatus === 'parcial').length;
    
    // Mesas
    const assignedIds = new Set(data.tables.flatMap(t => t.assignedGuestIds).filter(id => id !== ''));
    const unseatedCount = allMembers.filter(m => m.attending === true && !assignedIds.has(m.id)).length;
    
    // Presupuesto
    const totalSpent = data.expenses.reduce((acc, curr) => acc + curr.actual, 0);
    const budgetUsage = (totalSpent / data.budget) * 100;
    
    // Proveedores
    const latePayments = data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0 && v.dueDate && new Date(v.dueDate) < new Date()).length;
    const criticalCats = ['Lugar', 'Catering', 'Fotografía', 'Música'];
    const missingCritical = criticalCats.some(cat => !data.vendors.find(v => v.category.includes(cat)));

    // Estado General
    let status: 'control' | 'atencion' | 'riesgo' = 'control';
    if (latePayments > 0 || budgetUsage > 100) status = 'riesgo';
    else if (missingCritical || unseatedCount > 0 || urgentTasks > 0 || budgetUsage > 80) status = 'atencion';

    // Progreso General (Promedio de 3 pilares)
    const taskProgress = data.tasks.length > 0 ? (data.tasks.filter(t => t.completed).length / data.tasks.length) * 100 : 0;
    const guestProgress = data.guests.length > 0 ? (data.guests.filter(g => g.confirmation === 'si').length / data.guests.length) * 100 : 0;
    const vendorProgress = (data.vendors.filter(v => v.status === 'Contratado').length / 10) * 100; // Asumiendo 10 categorías clave
    const overallProgress = Math.round((taskProgress + guestProgress + Math.min(100, vendorProgress)) / 3);

    return {
      activeTasks,
      urgentTasks,
      pendingRSVP,
      unseatedCount,
      budgetUsage,
      latePayments,
      missingCritical,
      status,
      overallProgress
    };
  }, [data]);

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Panel Principal', 
      icon: ICONS.Dashboard,
      badge: null 
    },
    { 
      id: 'guests', 
      label: 'Invitados', 
      icon: ICONS.Guests,
      badge: sidebarMetrics.pendingRSVP > 0 ? { type: 'dot', color: 'bg-[#C6A75E]' } : null
    },
    { 
      id: 'seating', 
      label: 'Plano de Mesas', 
      icon: ICONS.Seating,
      badge: sidebarMetrics.unseatedCount > 0 ? { type: 'count', value: sidebarMetrics.unseatedCount, color: 'bg-amber-400' } : null
    },
    { 
      id: 'rsvp', 
      label: 'Confirmaciones', 
      icon: ICONS.RSVP,
      badge: null 
    },
    { 
      id: 'vendors', 
      label: 'Proveedores', 
      icon: ICONS.Vendors,
      badge: sidebarMetrics.latePayments > 0 
        ? { type: 'dot', color: 'bg-rose-500' } 
        : (sidebarMetrics.missingCritical ? { type: 'dot', color: 'bg-amber-400' } : null)
    },
    { 
      id: 'budget', 
      label: 'Presupuesto', 
      icon: ICONS.Budget,
      badge: sidebarMetrics.budgetUsage > 80 ? { type: 'icon', icon: <TrendingUp size={10} />, color: 'bg-rose-500' } : null
    },
    { 
      id: 'tasks', 
      label: 'Tareas pendientes', 
      icon: ICONS.Tasks,
      badge: sidebarMetrics.activeTasks > 0 ? { type: 'count', value: sidebarMetrics.activeTasks, color: 'bg-[#0F1A2E]' } : null
    },
  ];

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const collapsed = isMobile ? false : effectiveCollapsed;
    return (
    <>
      {/* Logo & Brand */}
      <div className={`px-4 py-5 flex items-center justify-between border-b border-stone-50 transition-all duration-300 ${collapsed ? 'flex-col gap-4' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'mx-auto' : ''}`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg" style={{ backgroundColor: COLORS.accent }}>
            {React.cloneElement(ICONS.Heart as any, { size: 16 })}
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <h1 className="text-lg font-bold text-stone-800 leading-tight serif">Endless Love</h1>
              <p className="text-[8px] uppercase tracking-[0.2em] font-bold" style={{ color: COLORS.detail }}>Luxury Planner</p>
            </div>
          )}
        </div>
        
        {!isMobile && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 text-stone-400 hover:text-[#0F1A2E] hover:bg-stone-50 rounded-lg transition-all ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      {/* Intelligent Status Block */}
      {!collapsed && (
        <div className="px-3 py-3 animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="bg-stone-50/80 rounded-xl p-2.5 border border-stone-100/50 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  sidebarMetrics.status === 'riesgo' ? 'bg-rose-500' : (sidebarMetrics.status === 'atencion' ? 'bg-amber-400' : 'bg-emerald-500')
                }`} />
                <span className="text-[10px] font-bold text-stone-700">
                  {sidebarMetrics.status === 'riesgo' ? 'Riesgo' : (sidebarMetrics.status === 'atencion' ? 'Atención' : 'Control')}
                </span>
             </div>
             <span className="text-[9px] font-bold text-[#C6A75E]">{sidebarMetrics.overallProgress}%</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0 mt-2 overflow-y-auto custom-sidebar-scroll">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group/nav">
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all relative overflow-hidden ${
                  isActive 
                    ? 'text-white font-bold shadow-md shadow-[#0F1A2E]/10 z-10' 
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                } ${collapsed ? 'justify-center' : ''}`}
                style={{ backgroundColor: isActive ? COLORS.accent : 'transparent' }}
              >
                <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/nav:scale-110'}`}>
                  {React.cloneElement(item.icon as any, { size: 16 })}
                </div>
                {!collapsed && (
                  <span className="text-[11px] tracking-tight animate-in fade-in slide-in-from-left-1 flex-1 text-left">{item.label}</span>
                )}
                
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C6A75E]" />
                )}

                {item.badge && (
                  <div className={`${collapsed ? 'absolute top-1.5 right-1.5' : 'ml-auto'} z-20`}>
                    {item.badge.type === 'dot' && <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${item.badge.color}`} />}
                    {item.badge.type === 'count' && (
                      <div className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white ${item.badge.color}`}>
                        {item.badge.value}
                      </div>
                    )}
                    {item.badge.type === 'icon' && !collapsed && (
                       <div className={`p-1 rounded-full text-white ${item.badge.color}`}>
                         {item.badge.icon}
                       </div>
                    )}
                  </div>
                )}
              </button>
              
              {collapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-[#0F1A2E] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-2xl">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Info & Progress */}
      <div className="p-2 border-t border-stone-50 space-y-2">
        {!collapsed && (
          <div className="px-2 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-700">
             <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-[#C6A75E] transition-all duration-1000 ease-out" 
                  style={{ width: `${sidebarMetrics.overallProgress}%` }} 
                />
             </div>
          </div>
        )}

        <div className={`p-2 bg-stone-50 rounded-xl flex items-center gap-2 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-white text-[9px] font-bold shrink-0 shadow-inner" style={{ backgroundColor: COLORS.detail }}>
            {data.partner1[0]}{data.partner2[0]}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-stone-800">
              <p className="text-[9px] font-bold truncate uppercase tracking-tighter">{data.partner1} & {data.partner2}</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-2 px-2.5 py-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest ${collapsed ? 'justify-center' : ''}`}
        >
          {React.cloneElement(ICONS.LogOut as any, { size: 14 })}
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </>
  );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
      {/* Desktop Sidebar */}
      <aside 
        className={`bg-white border-r border-stone-200 flex flex-col hidden md:flex transition-all duration-500 ease-in-out relative group z-40 ${effectiveCollapsed ? 'w-20' : 'w-56'}`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-white z-[70] md:hidden transition-transform duration-500 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* Contenido Principal */}
      <main className={`flex-1 flex flex-col bg-stone-50/50 ${activeTab === 'seating' ? 'overflow-hidden' : 'overflow-y-auto'}`}>

        {/* Mobile Header */}
        <div className="md:hidden p-4 flex items-center justify-between border-b bg-white sticky top-0 z-30">
           <div className="flex items-center gap-2">
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="p-2 -ml-2 text-stone-500 hover:bg-stone-50 rounded-xl"
             >
               <Menu size={20} />
             </button>
             <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: COLORS.accent }}>
               {ICONS.Heart}
             </div>
             <h1 className="text-lg font-bold text-stone-800 serif">Endless Love</h1>
           </div>
           <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsNotifPanelOpen(!isNotifPanelOpen)}
                  className="p-2 text-stone-400"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotifPanelOpen && (
                  <div className="fixed inset-x-4 top-16 z-[100]">
                    <NotificationPanel 
                      onClose={() => setIsNotifPanelOpen(false)} 
                      onViewAll={() => setActiveTab('notifications')}
                      onNavigate={handleNavigate}
                      weddingId={userProfile?.wedding_id || ''}
                      userId={userProfile?.id}
                    />
                  </div>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500">
                {data.partner1[0]}{data.partner2[0]}
              </div>
           </div>
        </div>

        <div className={`max-w-7xl mx-auto p-4 md:p-8 w-full ${activeTab === 'seating' ? 'flex-1 flex flex-col min-h-0 pb-4 md:pb-6' : 'pb-24 md:pb-8'}`}>
          {/* Desktop Notification Bell (In-flow) */}
          <div className="hidden md:flex justify-end mb-6">
            <div className="relative z-40">
              <button 
                onClick={() => setIsNotifPanelOpen(!isNotifPanelOpen)}
                className="p-2.5 bg-white rounded-xl border border-stone-100 shadow-sm text-stone-400 hover:text-[#0F1A2E] hover:shadow-md transition-all relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {isNotifPanelOpen && (
                <NotificationPanel 
                  onClose={() => setIsNotifPanelOpen(false)} 
                  onViewAll={() => setActiveTab('notifications')}
                  onNavigate={handleNavigate}
                  weddingId={userProfile?.wedding_id || ''}
                  userId={userProfile?.id}
                />
              )}
            </div>
          </div>

          {children}
        </div>

        {/* Mobile Tab Bar (Optional but good for UX) */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-stone-100 rounded-[2rem] shadow-2xl flex justify-around p-2 z-50">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-3.5 rounded-2xl transition-all relative ${activeTab === item.id ? 'text-white shadow-lg' : 'text-stone-400'}`}
              style={{ backgroundColor: activeTab === item.id ? COLORS.accent : 'transparent' }}
            >
              {React.cloneElement(item.icon as any, { size: 18 })}
              {item.badge && activeTab !== item.id && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border border-white ${item.badge.color}`} />
              )}
            </button>
          ))}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-3.5 rounded-2xl text-stone-400"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-sidebar-scroll::-webkit-scrollbar { width: 0px; }
        .custom-sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};
