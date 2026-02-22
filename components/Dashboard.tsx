
import React, { useState, useEffect, useMemo } from 'react';
import { ICONS, COLORS } from '../constants';
import { WeddingData, Vendor, Task } from '../types';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, DollarSign, Users, Briefcase, LayoutPanelTop, Utensils } from 'lucide-react';

interface DashboardProps {
  data: WeddingData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

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
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-700 max-w-full overflow-hidden">
      {/* Header Editorial Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-stone-100">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold text-stone-800 serif tracking-tight">
            {data.partner1} & {data.partner2}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-stone-400">
            <p className="text-base md:text-lg italic serif">21 de agosto de 2027</p>
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
        <div className="bg-white px-6 md:px-10 py-5 md:py-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-stone-100 flex items-center justify-around md:justify-center gap-4 md:gap-10">
          <div className="text-center group">
            <span className="block text-2xl md:text-4xl font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.days}</span>
            <span className="text-[8px] md:text-[9px] uppercase font-bold text-stone-400 tracking-[0.2em]">Días</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-stone-100" />
          <div className="text-center group">
            <span className="block text-2xl md:text-4xl font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.hours}</span>
            <span className="text-[8px] md:text-[9px] uppercase font-bold text-stone-400 tracking-[0.2em]">Horas</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-stone-100" />
          <div className="text-center group">
            <span className="block text-2xl md:text-4xl font-bold text-stone-800 group-hover:text-[#C6A75E] transition-colors">{timeLeft.minutes}</span>
            <span className="text-[8px] md:text-[9px] uppercase font-bold text-stone-400 tracking-[0.2em]">Min</span>
          </div>
        </div>
      </header>

      {/* General Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatusCard 
          icon={<Users size={20} />} 
          title="Invitados" 
          primary={`${metrics.confirmedCount} Confirmados`} 
          secondary={`${metrics.allMembers.length - metrics.confirmedCount} Pendientes`}
          alert={metrics.unseatedCount > 0 ? `${metrics.unseatedCount} sin mesa` : undefined}
          color="bg-stone-50"
        />
        <StatusCard 
          icon={<Briefcase size={20} />} 
          title="Proveedores" 
          primary={`${metrics.contractedVendors} Contratados`} 
          secondary={`${data.vendors.length - metrics.contractedVendors} en negociación`}
          alert={metrics.latePayments > 0 ? `¡PAGOS VENCIDOS!` : undefined}
          color="bg-stone-50"
        />
        <StatusCard 
          icon={<DollarSign size={20} />} 
          title="Presupuesto" 
          primary={`$${metrics.committedBudget.toLocaleString()}`} 
          secondary={`De $${metrics.totalBudget.toLocaleString()} total`}
          alert={metrics.availableBudget < 0 ? `Excedido por $${Math.abs(metrics.availableBudget).toLocaleString()}` : `$${metrics.availableBudget.toLocaleString()} disponible`}
          color="bg-stone-50"
        />
        <StatusCard 
          icon={<CheckCircle2 size={20} />} 
          title="Checklist" 
          primary={`${data.tasks.length > 0 ? Math.round((metrics.completedTasks / data.tasks.length) * 100) : 0}% Completado`} 
          secondary={`${metrics.completedTasks} de ${data.tasks.length} tareas`}
          alert={metrics.nextTask ? `Prox: ${metrics.nextTask.title}` : undefined}
          color="bg-[#0F1A2E]"
          dark
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Actions & Key Vendors */}
        <div className="lg:col-span-2 space-y-8">
          {/* Priority Action Card */}
          {priorityAction && (
            <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border flex flex-col sm:flex-row items-center gap-6 shadow-sm transition-all hover:shadow-md ${
              priorityAction.type === 'error' ? 'bg-rose-50 border-rose-100' : 
              (priorityAction.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100')
            }`}>
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                {priorityAction.icon}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Acción Prioritaria</p>
                <h4 className="text-lg md:text-xl font-bold text-stone-800 serif">{priorityAction.title}</h4>
                <p className="text-sm text-stone-500 mt-1">{priorityAction.desc}</p>
              </div>
              <button className="w-full sm:w-auto px-6 py-3 bg-white rounded-xl text-xs font-bold text-stone-800 shadow-sm hover:shadow-md transition-all active:scale-95">
                Resolver ahora
              </button>
            </div>
          )}

          {/* Key Vendor Matrix */}
          <section className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-stone-800 serif">Proveedores Clave</h3>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Estado Crítico</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {keyVendors.map((item, idx) => (
                  <div key={idx} className="p-5 md:p-6 rounded-2xl md:rounded-3xl border border-stone-50 hover:bg-stone-50 transition-colors group">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">{item.label}</p>
                    <div className="flex items-center justify-between">
                       <h5 className="font-bold text-stone-800 text-sm truncate max-w-[120px]">
                        {item.data ? item.data.name : 'No asignado'}
                       </h5>
                       {item.data ? (
                         <CheckCircle2 size={16} className="text-emerald-500" />
                       ) : (
                         <Clock size={16} className="text-amber-400" />
                       )}
                    </div>
                    <p className={`text-[10px] mt-2 font-bold uppercase ${item.data?.status === 'Contratado' ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {item.data ? item.data.status : 'Pendiente'}
                    </p>
                  </div>
                ))}
             </div>
          </section>

          {/* Financial Bar Chart */}
          <section className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
               <h3 className="text-xl md:text-2xl font-bold text-stone-800 serif">Flujo de Presupuesto</h3>
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-10 pt-8 border-t border-stone-50">
               <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Pagado</p>
                  <p className="text-lg md:text-xl font-bold text-stone-800">${metrics.totalPaid.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Por Pagar</p>
                  <p className="text-lg md:text-xl font-bold text-stone-800">${(metrics.committedBudget - metrics.totalPaid).toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Disponible</p>
                  <p className="text-lg md:text-xl font-bold text-[#C6A75E]">${Math.max(0, metrics.availableBudget).toLocaleString()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Ejecución</p>
                  <p className="text-lg md:text-xl font-bold text-stone-800">{Math.round((metrics.committedBudget / metrics.totalBudget) * 100)}%</p>
               </div>
            </div>
          </section>
        </div>

        {/* Right Column: Logistics & Summary */}
        <div className="space-y-8">
           <section className="bg-[#F4EFE6] p-8 rounded-[2.5rem] border border-stone-200 shadow-inner">
              <h4 className="text-lg font-bold text-stone-800 serif mb-6 flex items-center gap-2">
                 <LayoutPanelTop size={18} className="text-[#C6A75E]" /> Resumen Logístico
              </h4>
              <ul className="space-y-4">
                 <LogisticsItem label="Mesas creadas" value={data.tables.length} icon={<LayoutPanelTop size={14} />} />
                 <LogisticsItem label="Sin mesa asignada" value={metrics.unseatedCount} icon={<Users size={14} />} alert={metrics.unseatedCount > 0} />
                 <LogisticsItem label="Notas alimenticias" value={metrics.dietaryCount} icon={<Utensils size={14} />} />
                 <LogisticsItem label="Capacidad asignada" value={`${metrics.allMembers.length - metrics.unseatedCount} personas`} icon={<CheckCircle2 size={14} />} />
              </ul>
              <div className="mt-8 pt-6 border-t border-stone-200">
                 <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Próximo Pago</p>
                 {data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ? (
                   <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-xs font-bold text-stone-800">{data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].name}</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">{data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate}</p>
                         </div>
                         <p className="text-xs font-bold text-rose-500">${(data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].totalAmount - data.vendors.filter(v => (v.totalAmount - v.paidAmount) > 0).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].paidAmount).toLocaleString()}</p>
                      </div>
                   </div>
                 ) : <p className="text-xs italic text-stone-400">Sin pagos próximos</p>}
              </div>
           </section>

           <div className="bg-[#0F1A2E] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-white font-bold text-2xl serif mb-2">Endless Love IA</h4>
                <p className="text-stone-400 text-xs leading-relaxed mb-6">¿Necesitas ayuda con el presupuesto o sugerencias de proveedores?</p>
                <button className="w-full py-4 bg-[#C6A75E] text-white font-bold rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2">
                   {ICONS.AI} Abrir Asistente
                </button>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-12 -translate-y-12">
                 {React.cloneElement(ICONS.Heart, { size: 240 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Internal Subcomponents
const StatusCard = ({ icon, title, primary, secondary, alert, color, dark = false }: any) => (
  <div className={`p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between h-56 transition-all hover:shadow-lg ${color} ${dark ? 'text-white' : 'text-stone-800'}`}>
    <div className="flex items-center justify-between">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${dark ? 'bg-white/10' : 'bg-white text-[#C6A75E]'}`}>
        {icon}
      </div>
      <ArrowUpRight className={dark ? 'text-white/20' : 'text-stone-200'} size={18} />
    </div>
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dark ? 'text-white/40' : 'text-stone-400'}`}>{title}</p>
      <h4 className="text-xl font-bold serif leading-tight">{primary}</h4>
      <p className={`text-[11px] mt-1 ${dark ? 'text-white/30' : 'text-stone-400'}`}>{secondary}</p>
    </div>
    {alert && (
      <div className={`mt-4 pt-4 border-t ${dark ? 'border-white/10' : 'border-stone-100'}`}>
         <p className={`text-[9px] font-bold uppercase tracking-widest ${alert.includes('!') || alert.includes('Excedido') ? 'text-rose-400' : (dark ? 'text-[#C6A75E]' : 'text-[#C6A75E]')}`}>
            {alert}
         </p>
      </div>
    )}
  </div>
);

const LogisticsItem = ({ label, value, icon, alert = false }: any) => (
  <li className="flex items-center justify-between group">
     <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-stone-400 group-hover:text-[#C6A75E] transition-colors shadow-sm">
           {icon}
        </div>
        <span className="text-xs font-medium text-stone-600">{label}</span>
     </div>
     <span className={`text-xs font-bold ${alert ? 'text-rose-500' : 'text-stone-800'}`}>{value}</span>
  </li>
);
