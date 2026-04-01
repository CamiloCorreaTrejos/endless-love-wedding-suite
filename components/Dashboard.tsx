
import React, { useState, useEffect, useMemo } from 'react';
import { ICONS, COLORS } from '../constants';
import { WeddingData, Vendor, Task } from '../types';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, DollarSign, Users, Briefcase, LayoutPanelTop, Utensils, Mail } from 'lucide-react';
import { AIPlanner } from './AIPlanner';
import { Modal } from './Modal';

interface DashboardProps {
  data: WeddingData;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, setActiveTab }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Countdown logic
  useEffect(() => {
    const targetDate = new Date(`${data.date}T00:00:00`);
    const calculateTime = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60)
        });
      }
    };
    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [data.date]);

  // Strategic Calculations
  const metrics = useMemo(() => {
    const allMembers = data.guests.flatMap(g => g.members);
    const confirmedCount = data.guests
      .filter(inv => inv.confirmation === 'Sí')
      .reduce((acc, inv) => acc + inv.members.length, 0);
    
    const assignedIds = new Set(data.tables.flatMap(t => t.assignedGuestIds));
    const unseatedCount = allMembers.filter(m => !assignedIds.has(m.id)).length;

    const totalBudget = data.budget;
    const committedBudget = data.expenses.reduce((acc, curr) => acc + curr.estimated, 0);
    const totalPaid = data.vendors.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalSpent = data.expenses.reduce((acc, curr) => acc + curr.actual, 0);
    const availableBudget = totalBudget - committedBudget;

    const contractedVendors = data.vendors.filter(v => v.status === 'Contratado').length;
    const latePayments = data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0 && v.dueDate && new Date(v.dueDate) < new Date()).length;

    const completedTasks = data.tasks.filter(t => t.completed).length;
    const nextTask = data.tasks.filter(t => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    const dietaryCount = data.guests.filter(g => g.dietary && g.dietary.trim() !== '').length;
    const pendingRsvps = data.guests.filter(g => g.rsvpStatus === 'pendiente' || g.rsvpStatus === 'parcial').length;

    return {
      allMembers,
      confirmedCount,
      unseatedCount,
      totalBudget,
      committedBudget,
      totalPaid,
      availableBudget,
      contractedVendors,
      latePayments,
      completedTasks,
      nextTask,
      dietaryCount,
      pendingRsvps
    };
  }, [data]);

  // Key Vendor Tracking
  const keyVendors = useMemo(() => {
    const check = (cat: string) => data.vendors.find(v => v.category.toLowerCase().includes(cat.toLowerCase()));
    return [
      { label: 'Lugar', data: check('Lugar') },
      { label: 'Catering', data: check('Catering') },
      { label: 'Fotografía', data: check('Fotografía') },
      { label: 'Música', data: check('Música') || check('DJ') },
    ];
  }, [data.vendors]);

  // Centralized navigation logic for dynamic actions
  const getPriorityActionTarget = (actionType: string): string => {
    switch (actionType) {
      case 'unseated_guests':
        return 'seating';
      case 'pending_rsvp':
        return 'rsvp';
      case 'overdue_tasks':
      case 'upcoming_tasks':
      case 'next_task':
        return 'tasks';
      case 'pending_payments':
      case 'missing_venue':
        return 'vendors';
      case 'critical_budget':
      case 'budget_exceeded':
        return 'budget';
      case 'important_notifications':
        return 'notifications';
      default:
        return 'dashboard'; // Fallback seguro
    }
  };

  const handlePriorityActionClick = (actionType: string) => {
    const target = getPriorityActionTarget(actionType);
    setActiveTab(target);
  };

  // Dynamic Priority Action
  const priorityAction = useMemo(() => {
    // 1. Late payments are absolute priority
    if (metrics.latePayments > 0) {
      return {
        id: 'pending_payments',
        title: "Pagos Vencidos",
        desc: `Tienes ${metrics.latePayments} pagos pendientes que ya han vencido.`,
        type: 'error',
        icon: <AlertCircle className="text-rose-500" />
      };
    }
    // 2. Budget Exceeded
    if (metrics.availableBudget < 0) {
      return {
        id: 'budget_exceeded',
        title: "Presupuesto Excedido",
        desc: `Has superado tu presupuesto en $${Math.abs(metrics.availableBudget).toLocaleString()}. Revisa tus gastos.`,
        type: 'error',
        icon: <DollarSign className="text-rose-500" />
      };
    }
    // 3. Critical Vendor missing
    const missingVenue = !keyVendors.find(v => v.label === 'Lugar')?.data;
    if (missingVenue) {
      return {
        id: 'missing_venue',
        title: "Reserva el Lugar",
        desc: "Aún no tienes un lugar contratado. Es el pilar fundamental de la boda.",
        type: 'warning',
        icon: <Briefcase className="text-amber-500" />
      };
    }
    // 4. Pending RSVPs
    if (metrics.pendingRsvps > 0) {
      return {
        id: 'pending_rsvp',
        title: "Confirmaciones Pendientes",
        desc: `Tienes ${metrics.pendingRsvps} grupos con RSVP pendiente o parcial.`,
        type: 'warning',
        icon: <Mail className="text-amber-500" />
      };
    }
    // 5. Unseated Guests
    if (metrics.unseatedCount > 0) {
      return {
        id: 'unseated_guests',
        title: "Invitados sin Mesa",
        desc: `Tienes ${metrics.unseatedCount} invitados confirmados sin asiento asignado.`,
        type: 'warning',
        icon: <Users className="text-amber-500" />
      };
    }
    // 6. Next Task
    if (metrics.nextTask) {
      const isOverdue = new Date(metrics.nextTask.dueDate) < new Date();
      return {
        id: isOverdue ? 'overdue_tasks' : 'upcoming_tasks',
        title: isOverdue ? "Tarea Vencida" : "Próxima Tarea",
        desc: `${metrics.nextTask.title} ${isOverdue ? 'venció' : 'vence'} el ${metrics.nextTask.dueDate}.`,
        type: isOverdue ? 'error' : 'info',
        icon: <Clock className={isOverdue ? "text-rose-500" : "text-blue-500"} />
      };
    }
    return null;
  }, [metrics, keyVendors]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-full overflow-hidden">
      {/* Header Editorial Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-2 border-b border-stone-100">
        <div className="space-y-0.5">
          <h1 className="text-xl md:text-2xl font-bold text-stone-800 serif tracking-tight">
            {data.partner1} & {data.partner2}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-stone-400">
            <p className="text-xs italic serif">21 de agosto de 2027</p>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-stone-300" />
            <div className="flex gap-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#C6A75E]">
                {metrics.confirmedCount} Invitados
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#C6A75E]">
                {metrics.contractedVendors} Proveedores
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Visualizer */}
        <div className="bg-white px-3 py-1 rounded-xl shadow-sm border border-stone-100 flex items-center justify-around md:justify-center gap-3 md:gap-4">
          <div className="text-center group">
            <span className="block text-base font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.days}</span>
            <span className="text-[7px] uppercase font-bold text-stone-400 tracking-[0.2em]">Días</span>
          </div>
          <div className="w-px h-4 bg-stone-100" />
          <div className="text-center group">
            <span className="block text-base font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.hours}</span>
            <span className="text-[7px] uppercase font-bold text-stone-400 tracking-[0.2em]">Horas</span>
          </div>
          <div className="w-px h-4 bg-stone-100" />
          <div className="text-center group">
            <span className="block text-base font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.minutes}</span>
            <span className="text-[7px] uppercase font-bold text-stone-400 tracking-[0.2em]">Min</span>
          </div>
        </div>
      </header>

      {/* General Health Unified Summary */}
      <div className="bg-stone-100 rounded-2xl border border-stone-100 shadow-sm overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px">
        <SummarySection 
          icon={<Users size={14} />} 
          title="Invitados" 
          primary={`${metrics.confirmedCount} Confirmados`} 
          secondary={`${metrics.allMembers.length - metrics.confirmedCount} Pendientes`}
          alert={metrics.unseatedCount > 0 ? `${metrics.unseatedCount} sin mesa` : undefined}
        />
        <SummarySection 
          icon={<Briefcase size={14} />} 
          title="Proveedores" 
          primary={`${metrics.contractedVendors} Contratados`} 
          secondary={`${data.vendors.length - metrics.contractedVendors} en negociación`}
          alert={metrics.latePayments > 0 ? `¡PAGOS VENCIDOS!` : undefined}
        />
        <SummarySection 
          icon={<DollarSign size={14} />} 
          title="Presupuesto" 
          primary={`$${metrics.committedBudget.toLocaleString()}`} 
          secondary={`De $${metrics.totalBudget.toLocaleString()} total`}
          alert={metrics.availableBudget < 0 ? `Excedido por $${Math.abs(metrics.availableBudget).toLocaleString()}` : `$${metrics.availableBudget.toLocaleString()} disponible`}
        />
        <SummarySection 
          icon={<CheckCircle2 size={14} />} 
          title="Checklist" 
          primary={`${data.tasks.length > 0 ? Math.round((metrics.completedTasks / data.tasks.length) * 100) : 0}% Completado`} 
          secondary={`${metrics.completedTasks} de ${data.tasks.length} tareas`}
          alert={metrics.nextTask ? `Prox: ${metrics.nextTask.title}` : undefined}
          isDarkAccent
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Actions & Key Vendors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority Action Card */}
          {priorityAction && (
            <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center gap-3 shadow-sm transition-all hover:shadow-md ${
              priorityAction.type === 'error' ? 'bg-rose-50 border-rose-100' : 
              (priorityAction.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100')
            }`}>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                {React.cloneElement(priorityAction.icon as React.ReactElement<any>, { size: 16 })}
              </div>
              <div className="flex-1 text-left">
                <p className="text-[8px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Acción Prioritaria</p>
                <h4 className="text-sm font-bold text-stone-800 serif">{priorityAction.title}</h4>
                <p className="text-[10px] text-stone-500 mt-0.5">{priorityAction.desc}</p>
              </div>
              <button 
                onClick={() => handlePriorityActionClick(priorityAction.id)}
                className="w-full sm:w-auto px-3 py-1.5 bg-white rounded-xl text-[10px] font-bold text-stone-800 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                Resolver ahora
              </button>
            </div>
          )}

          {/* Key Vendor Matrix */}
          <section className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-stone-800 serif">Proveedores Clave</h3>
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Estado Crítico</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {keyVendors.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-stone-50 hover:bg-stone-50 transition-colors group">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                    <div className="flex items-center justify-between">
                       <h5 className="font-bold text-stone-800 text-xs truncate max-w-[100px]">
                        {item.data ? item.data.name : 'No asignado'}
                       </h5>
                       {item.data ? (
                         <CheckCircle2 size={14} className="text-emerald-500" />
                       ) : (
                         <Clock size={14} className="text-amber-400" />
                       )}
                    </div>
                    <p className={`text-[9px] mt-1 font-bold uppercase ${item.data?.status === 'Contratado' ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {item.data ? item.data.status : 'Pendiente'}
                    </p>
                  </div>
                ))}
             </div>
          </section>

          {/* Financial Bar Chart */}
          <section className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
               <h3 className="text-base font-bold text-stone-800 serif">Flujo de Presupuesto</h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#0F1A2E]" />
                     <span className="text-[9px] font-bold text-stone-400 uppercase">Pagado</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#C6A75E]" />
                     <span className="text-[9px] font-bold text-stone-400 uppercase">Comprometido</span>
                  </div>
               </div>
            </div>
            
            <div className="space-y-1">
               <div className="h-1.5 w-full bg-stone-100 rounded-full flex overflow-hidden shadow-inner relative">
                  <div 
                    className="h-full bg-[#0F1A2E] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, metrics.totalBudget > 0 ? (metrics.totalPaid / metrics.totalBudget) * 100 : 0)}%` }} 
                  />
                  <div 
                    className={`h-full opacity-80 transition-all duration-1000 ${metrics.availableBudget < 0 ? 'bg-rose-500' : 'bg-[#C6A75E]'}`}
                    style={{ width: `${Math.min(100 - (metrics.totalBudget > 0 ? (metrics.totalPaid / metrics.totalBudget) * 100 : 0), metrics.totalBudget > 0 ? ((metrics.committedBudget - metrics.totalPaid) / metrics.totalBudget) * 100 : 0)}%` }} 
                  />
               </div>
               <div className="flex justify-between text-stone-400 text-[7px] font-bold uppercase tracking-widest mt-0.5">
                  <span>0%</span>
                  <span className="hidden sm:inline">50%</span>
                  <span>100% Presupuesto</span>
               </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 pt-2 border-t border-stone-50">
               <div>
                  <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Pagado</p>
                  <p className="text-xs font-bold text-stone-800">${metrics.totalPaid.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Por Pagar</p>
                  <p className="text-xs font-bold text-stone-800">${(metrics.committedBudget - metrics.totalPaid).toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Disponible</p>
                  <p className={`text-xs font-bold ${metrics.availableBudget < 0 ? 'text-rose-500' : 'text-[#C6A75E]'}`}>${metrics.availableBudget.toLocaleString()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Ejecución</p>
                  <p className="text-xs font-bold text-stone-800">{metrics.totalBudget > 0 ? Math.round((metrics.committedBudget / metrics.totalBudget) * 100) : 0}%</p>
               </div>
            </div>
          </section>
        </div>

        {/* Right Column: Logistics & Summary */}
        <div className="space-y-4">
           <section className="bg-[#F4EFE6] p-3 rounded-xl border border-stone-200 shadow-inner">
              <h4 className="text-sm font-bold text-stone-800 serif mb-2 flex items-center gap-2">
                 <LayoutPanelTop size={14} className="text-[#C6A75E]" /> Resumen Logístico
              </h4>
              <ul className="space-y-1">
                 <LogisticsItem label="Mesas creadas" value={data.tables.length} icon={<LayoutPanelTop size={12} />} />
                 <LogisticsItem label="Sin mesa asignada" value={metrics.unseatedCount} icon={<Users size={12} />} alert={metrics.unseatedCount > 0} />
                 <LogisticsItem label="Notas alimenticias" value={metrics.dietaryCount} icon={<Utensils size={12} />} />
                 <LogisticsItem label="Capacidad asignada" value={`${metrics.allMembers.length - metrics.unseatedCount} personas`} icon={<CheckCircle2 size={12} />} />
              </ul>
              <div className="mt-2 pt-2 border-t border-stone-200">
                 <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Próximo Pago</p>
                 {(() => {
                   const nextPayment = data.vendors
                     .filter(v => (v.totalAmount - v.paidAmount) > 0 && v.dueDate)
                     .sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];
                   
                   if (!nextPayment) return <p className="text-[9px] italic text-stone-400">Sin pagos próximos</p>;
                   
                   const amountDue = nextPayment.totalAmount - nextPayment.paidAmount;
                   
                   return (
                     <div className="p-2 bg-white rounded-lg border border-stone-200 shadow-sm">
                        <div className="flex justify-between items-center">
                           <div>
                              <p className="text-[9px] font-bold text-stone-800">{nextPayment.name}</p>
                              <p className="text-[7px] text-stone-400 mt-0.5">{nextPayment.dueDate}</p>
                           </div>
                           <p className="text-[9px] font-bold text-rose-500">${amountDue.toLocaleString()}</p>
                        </div>
                     </div>
                   );
                 })()}
              </div>
           </section>

           <div className="bg-[#0F1A2E] p-4 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-white font-bold text-sm serif mb-1">Endless Love IA</h4>
                <p className="text-stone-400 text-[9px] leading-relaxed mb-3">¿Necesitas ayuda con el presupuesto o sugerencias de proveedores?</p>
                <button 
                  onClick={() => setIsAIOpen(true)}
                  className="w-full py-1.5 bg-[#C6A75E] text-white text-[10px] font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                   {React.cloneElement(ICONS.AI, { size: 14 })} Abrir Asistente
                </button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-8 -translate-y-8">
                 {React.cloneElement(ICONS.Heart, { size: 100 })}
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} title="Endless Love IA" subtitle="Tu consultor de bodas personal">
         <AIPlanner data={data} />
      </Modal>
    </div>
  );
};

// Internal Subcomponents
const SummarySection = ({ icon, title, primary, secondary, alert, isDarkAccent = false }: any) => (
  <div className="bg-white p-3 flex flex-col h-full relative group transition-colors hover:bg-stone-50/50">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm ${isDarkAccent ? 'bg-[#0F1A2E] text-white' : 'bg-stone-50 text-[#C6A75E]'}`}>
          {icon}
        </div>
        <p className="text-[8px] font-bold uppercase tracking-widest text-stone-400">{title}</p>
      </div>
      <ArrowUpRight className="text-stone-200 group-hover:text-[#C6A75E] transition-colors" size={12} />
    </div>
    <div className="mb-1.5">
      <h4 className={`text-base font-bold serif leading-tight ${isDarkAccent ? 'text-[#0F1A2E]' : 'text-stone-800'}`}>{primary}</h4>
      <p className="text-[9px] mt-0.5 text-stone-400 font-medium">{secondary}</p>
    </div>
    <div className="mt-auto">
      {alert ? (
        <div className="pt-2 border-t border-stone-50">
           <p className={`text-[8px] font-bold uppercase tracking-widest ${alert.includes('!') || alert.includes('Excedido') || alert.includes('sin mesa') ? 'text-rose-500' : 'text-[#C6A75E]'}`}>
              {alert}
           </p>
        </div>
      ) : (
        <div className="pt-2 border-t border-transparent">
           <p className="text-[8px] opacity-0 select-none">Placeholder</p>
        </div>
      )}
    </div>
  </div>
);

const LogisticsItem = ({ label, value, icon, alert = false }: any) => (
  <li className="flex items-center justify-between group">
     <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-stone-400 group-hover:text-[#C6A75E] transition-colors shadow-sm">
           {icon}
        </div>
        <span className="text-[11px] font-medium text-stone-600">{label}</span>
     </div>
     <span className={`text-[11px] font-bold ${alert ? 'text-rose-500' : 'text-stone-800'}`}>{value}</span>
  </li>
);
