
import React, { useState, useEffect, useMemo } from 'react';
import { ICONS, COLORS } from '../constants';
import { WeddingData, Vendor, Task } from '../types';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, DollarSign, Users, Briefcase, LayoutPanelTop, Utensils } from 'lucide-react';
import { AIPlanner } from './AIPlanner';
import { Modal } from './Modal';

interface DashboardProps {
  data: WeddingData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
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
    const committedBudget = data.vendors.reduce((acc, v) => acc + v.totalAmount, 0);
    const totalPaid = data.vendors.reduce((acc, v) => acc + v.paidAmount, 0);
    const availableBudget = totalBudget - committedBudget;

    const contractedVendors = data.vendors.filter(v => v.status === 'Contratado').length;
    const latePayments = data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0 && v.dueDate && new Date(v.dueDate) < new Date()).length;

    const completedTasks = data.tasks.filter(t => t.completed).length;
    const nextTask = data.tasks.filter(t => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    const dietaryCount = data.guests.filter(g => g.dietary && g.dietary.trim() !== '').length;

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
      dietaryCount
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

  // Dynamic Priority Action
  const priorityAction = useMemo(() => {
    // 1. Late payments are absolute priority
    if (metrics.latePayments > 0) {
      return {
        title: "Pagos Vencidos",
        desc: `Tienes ${metrics.latePayments} pagos pendientes de proveedores que ya han vencido.`,
        type: 'error',
        icon: <AlertCircle className="text-rose-500" />
      };
    }
    // 2. Critical Vendor missing
    const missingVenue = !keyVendors.find(v => v.label === 'Lugar')?.data;
    if (missingVenue) {
      return {
        title: "Reserva el Lugar",
        desc: "Aún no tienes un lugar contratado. Es el pilar fundamental de la boda.",
        type: 'warning',
        icon: <Briefcase className="text-amber-500" />
      };
    }
    // 3. Next Task
    if (metrics.nextTask) {
      return {
        title: "Próxima Tarea",
        desc: `${metrics.nextTask.title} vence el ${metrics.nextTask.dueDate}.`,
        type: 'info',
        icon: <Clock className="text-blue-500" />
      };
    }
    return null;
  }, [metrics, keyVendors]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-full overflow-hidden">
      {/* Header Editorial Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-stone-100">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 serif tracking-tight">
            {data.partner1} & {data.partner2}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-stone-400">
            <p className="text-sm md:text-base italic serif">21 de agosto de 2027</p>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-stone-200" />
            <div className="flex gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C6A75E]">
                {metrics.confirmedCount} Invitados
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C6A75E]">
                {metrics.contractedVendors} Proveedores
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Visualizer */}
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-around md:justify-center gap-4 md:gap-6">
          <div className="text-center group">
            <span className="block text-xl md:text-2xl font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.days}</span>
            <span className="text-[8px] uppercase font-bold text-stone-400 tracking-[0.2em]">Días</span>
          </div>
          <div className="w-px h-6 bg-stone-100" />
          <div className="text-center group">
            <span className="block text-xl md:text-2xl font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.hours}</span>
            <span className="text-[8px] uppercase font-bold text-stone-400 tracking-[0.2em]">Horas</span>
          </div>
          <div className="w-px h-6 bg-stone-100" />
          <div className="text-center group">
            <span className="block text-xl md:text-2xl font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.minutes}</span>
            <span className="text-[8px] uppercase font-bold text-stone-400 tracking-[0.2em]">Min</span>
          </div>
        </div>
      </header>

      {/* General Health Unified Summary */}
      <div className="bg-stone-100 rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px">
        <SummarySection 
          icon={<Users size={16} />} 
          title="Invitados" 
          primary={`${metrics.confirmedCount} Confirmados`} 
          secondary={`${metrics.allMembers.length - metrics.confirmedCount} Pendientes`}
          alert={metrics.unseatedCount > 0 ? `${metrics.unseatedCount} sin mesa` : undefined}
        />
        <SummarySection 
          icon={<Briefcase size={16} />} 
          title="Proveedores" 
          primary={`${metrics.contractedVendors} Contratados`} 
          secondary={`${data.vendors.length - metrics.contractedVendors} en negociación`}
          alert={metrics.latePayments > 0 ? `¡PAGOS VENCIDOS!` : undefined}
        />
        <SummarySection 
          icon={<DollarSign size={16} />} 
          title="Presupuesto" 
          primary={`$${metrics.committedBudget.toLocaleString()}`} 
          secondary={`De $${metrics.totalBudget.toLocaleString()} total`}
          alert={metrics.availableBudget < 0 ? `Excedido por $${Math.abs(metrics.availableBudget).toLocaleString()}` : `$${metrics.availableBudget.toLocaleString()} disponible`}
        />
        <SummarySection 
          icon={<CheckCircle2 size={16} />} 
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
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 shadow-sm transition-all hover:shadow-md ${
              priorityAction.type === 'error' ? 'bg-rose-50 border-rose-100' : 
              (priorityAction.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100')
            }`}>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                {priorityAction.icon}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Acción Prioritaria</p>
                <h4 className="text-base font-bold text-stone-800 serif">{priorityAction.title}</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">{priorityAction.desc}</p>
              </div>
              <button className="w-full sm:w-auto px-4 py-2 bg-white rounded-xl text-[11px] font-bold text-stone-800 shadow-sm hover:shadow-md transition-all active:scale-95">
                Resolver ahora
              </button>
            </div>
          )}

          {/* Key Vendor Matrix */}
          <section className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-800 serif">Proveedores Clave</h3>
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
          <section className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
               <h3 className="text-lg font-bold text-stone-800 serif">Flujo de Presupuesto</h3>
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
            
            <div className="space-y-4">
               <div className="h-6 w-full bg-stone-50 rounded-full flex overflow-hidden p-1 shadow-inner">
                  <div 
                    className="h-full bg-[#0F1A2E] rounded-full transition-all duration-1000" 
                    style={{ width: `${(metrics.totalPaid / metrics.totalBudget) * 100}%` }} 
                  />
                  <div 
                    className="h-full bg-[#C6A75E] opacity-60 rounded-full transition-all duration-1000 -ml-2" 
                    style={{ width: `${((metrics.committedBudget - metrics.totalPaid) / metrics.totalBudget) * 100}%` }} 
                  />
               </div>
               <div className="flex justify-between text-stone-400 text-[10px] font-bold uppercase tracking-widest px-2">
                  <span>0%</span>
                  <span className="hidden sm:inline">50%</span>
                  <span>100% Presupuesto</span>
               </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t border-stone-50">
               <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Pagado</p>
                  <p className="text-sm md:text-base font-bold text-stone-800">${metrics.totalPaid.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Por Pagar</p>
                  <p className="text-sm md:text-base font-bold text-stone-800">${(metrics.committedBudget - metrics.totalPaid).toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Disponible</p>
                  <p className="text-sm md:text-base font-bold text-[#C6A75E]">${Math.max(0, metrics.availableBudget).toLocaleString()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Ejecución</p>
                  <p className="text-sm md:text-base font-bold text-stone-800">{Math.round((metrics.committedBudget / metrics.totalBudget) * 100)}%</p>
               </div>
            </div>
          </section>
        </div>

        {/* Right Column: Logistics & Summary */}
        <div className="space-y-4">
           <section className="bg-[#F4EFE6] p-5 rounded-2xl border border-stone-200 shadow-inner">
              <h4 className="text-sm font-bold text-stone-800 serif mb-3 flex items-center gap-2">
                 <LayoutPanelTop size={14} className="text-[#C6A75E]" /> Resumen Logístico
              </h4>
              <ul className="space-y-2">
                 <LogisticsItem label="Mesas creadas" value={data.tables.length} icon={<LayoutPanelTop size={12} />} />
                 <LogisticsItem label="Sin mesa asignada" value={metrics.unseatedCount} icon={<Users size={12} />} alert={metrics.unseatedCount > 0} />
                 <LogisticsItem label="Notas alimenticias" value={metrics.dietaryCount} icon={<Utensils size={12} />} />
                 <LogisticsItem label="Capacidad asignada" value={`${metrics.allMembers.length - metrics.unseatedCount} personas`} icon={<CheckCircle2 size={12} />} />
              </ul>
              <div className="mt-4 pt-4 border-t border-stone-200">
                 <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Próximo Pago</p>
                 {data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ? (
                   <div className="p-2.5 bg-white rounded-xl border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-[11px] font-bold text-stone-800">{data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].name}</p>
                            <p className="text-[9px] text-stone-400 mt-0.5">{data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate}</p>
                         </div>
                         <p className="text-[11px] font-bold text-rose-500">${(data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].totalAmount - data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].paidAmount).toLocaleString()}</p>
                      </div>
                   </div>
                 ) : <p className="text-[11px] italic text-stone-400">Sin pagos próximos</p>}
              </div>
           </section>

           <div className="bg-[#0F1A2E] p-5 rounded-2xl shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-white font-bold text-lg serif mb-1">Endless Love IA</h4>
                <p className="text-stone-400 text-[9px] leading-relaxed mb-3">¿Necesitas ayuda con el presupuesto o sugerencias de proveedores?</p>
                <button 
                  onClick={() => setIsAIOpen(true)}
                  className="w-full py-2.5 bg-[#C6A75E] text-white text-[11px] font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                   {ICONS.AI} Abrir Asistente
                </button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-8 -translate-y-8">
                 {React.cloneElement(ICONS.Heart, { size: 140 })}
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
  <div className="bg-white p-5 flex flex-col justify-between h-full relative group transition-colors hover:bg-stone-50/50">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm ${isDarkAccent ? 'bg-[#0F1A2E] text-white' : 'bg-stone-50 text-[#C6A75E]'}`}>
          {icon}
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{title}</p>
      </div>
      <ArrowUpRight className="text-stone-200 group-hover:text-[#C6A75E] transition-colors" size={14} />
    </div>
    <div>
      <h4 className={`text-lg font-bold serif leading-tight ${isDarkAccent ? 'text-[#0F1A2E]' : 'text-stone-800'}`}>{primary}</h4>
      <p className="text-[10px] mt-0.5 text-stone-400 font-medium">{secondary}</p>
    </div>
    {alert && (
      <div className="mt-3 pt-3 border-t border-stone-50">
         <p className={`text-[9px] font-bold uppercase tracking-widest ${alert.includes('!') || alert.includes('Excedido') ? 'text-rose-500' : 'text-[#C6A75E]'}`}>
            {alert}
         </p>
      </div>
    )}
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
