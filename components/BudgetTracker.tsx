
import React, { useState, useMemo } from 'react';
import { ICONS, COLORS } from '../constants';
import { BudgetItem } from '../types';
import { Modal } from './Modal';
// Add missing icon import
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  PieChart, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight,
  ChevronDown,
  Info,
  DollarSign
} from 'lucide-react';

interface BudgetTrackerProps {
  expenses: BudgetItem[];
  totalBudget: number;
  onAddExpense: (item: Omit<BudgetItem, 'id'>) => void;
  onUpdateBudget: (value: number) => void;
  onRemoveExpense: (id: string) => void;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ expenses, totalBudget, onAddExpense, onUpdateBudget, onRemoveExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newItem, setNewItem] = useState({ 
    category: 'Lugar', 
    item: '', 
    estimated: 0, 
    actual: 0, 
    paid: false,
    date: new Date().toISOString().split('T')[0]
  });

  // Financial Calculations
  const metrics = useMemo(() => {
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.actual, 0);
    // Comprometido: Suma de estimados donde aún no hay gasto real, más el gasto real
    const totalCommitted = expenses.reduce((acc, curr) => {
      return acc + (curr.actual > 0 ? curr.actual : curr.estimated);
    }, 0);
    
    const remaining = totalBudget - totalSpent;
    const usagePercent = Math.min(100, Math.round((totalSpent / totalBudget) * 100));
    const committedPercent = Math.min(100, Math.round((totalCommitted / totalBudget) * 100));
    
    return {
      totalSpent,
      totalCommitted,
      remaining,
      usagePercent,
      committedPercent,
      isOverBudget: totalSpent > totalBudget,
      isNearLimit: (totalSpent / totalBudget) > 0.8
    };
  }, [expenses, totalBudget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.item) {
      onAddExpense({
        category: newItem.category,
        item: newItem.item,
        estimated: newItem.estimated || newItem.actual,
        actual: newItem.actual,
        paid: newItem.paid
      });
      setNewItem({ 
        category: 'Lugar', 
        item: '', 
        estimated: 0, 
        actual: 0, 
        paid: false,
        date: new Date().toISOString().split('T')[0]
      });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-700">
      {/* Header Editorial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 serif">Presupuesto</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-stone-400 text-xs">Control estratégico de la inversión nupcial</p>
            <div className="w-1 h-1 rounded-full bg-stone-200 hidden sm:block" />
            {isEditingBudget ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <input 
                  type="number" 
                  defaultValue={totalBudget}
                  onBlur={(e) => {
                    onUpdateBudget(Number(e.target.value));
                    setIsEditingBudget(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                  className="w-24 px-2 py-1 border-b-2 border-[#C6A75E] bg-transparent text-xs font-bold outline-none text-[#0F1A2E]"
                  autoFocus
                />
              </div>
            ) : (
              <button 
                onClick={() => setIsEditingBudget(true)}
                className="text-[9px] font-bold text-[#C6A75E] uppercase tracking-widest hover:text-[#0F1A2E] transition-colors flex items-center gap-1"
              >
                Límite: ${totalBudget.toLocaleString()} <ICONS.Edit.type {...ICONS.Edit.props} size={10} />
              </button>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#0F1A2E] text-white px-4 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.1em]"
        >
          {ICONS.Plus} Registrar Gasto
        </button>
      </div>

      {/* Strategic Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <BudgetMetric 
          label="Presupuesto" 
          value={`$${totalBudget.toLocaleString()}`} 
          icon={<Wallet size={18} />} 
          color="bg-stone-50" 
        />
        <BudgetMetric 
          label="Gastado" 
          value={`$${metrics.totalSpent.toLocaleString()}`} 
          icon={<TrendingUp size={18} />} 
          color="bg-stone-50" 
          status={metrics.isOverBudget ? 'error' : 'normal'}
        />
        <BudgetMetric 
          label="Comprometido" 
          value={`$${metrics.totalCommitted.toLocaleString()}`} 
          icon={<CreditCard size={18} />} 
          color="bg-stone-50" 
        />
        <BudgetMetric 
          label="Disponible" 
          value={`$${metrics.remaining.toLocaleString()}`} 
          icon={<PieChart size={18} />} 
          color={metrics.isNearLimit ? "bg-amber-50" : "bg-[#0F1A2E]"} 
          dark={!metrics.isNearLimit}
          status={metrics.isNearLimit ? 'warning' : 'normal'}
        />
      </div>

      {/* Main Financial Progress Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-stone-100 shadow-sm space-y-3 md:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
           <h3 className="text-base font-bold text-stone-800 serif">Visualización del Flujo</h3>
           <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3">
              <LegendItem color="bg-[#0F1A2E]" label="Gastado" value={metrics.usagePercent} />
              <LegendItem color="bg-[#C6A75E]" label="Pendiente" value={metrics.committedPercent - metrics.usagePercent} />
              <LegendItem color="bg-stone-100" label="Libre" value={100 - metrics.committedPercent} />
           </div>
        </div>

        <div className="space-y-2">
          <div className="h-2.5 w-full bg-stone-100 rounded-full flex overflow-hidden shadow-inner">
             <div 
               className="h-full bg-[#0F1A2E] rounded-l-full transition-all duration-1000 ease-out" 
               style={{ width: `${metrics.usagePercent}%` }} 
             />
             <div 
               className="h-full bg-[#C6A75E] transition-all duration-1000 ease-out delay-200" 
               style={{ width: `${Math.max(0, metrics.committedPercent - metrics.usagePercent)}%` }} 
             />
          </div>
          <div className="flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase tracking-widest px-1">
             <span>0% Inicio</span>
             <span className="hidden sm:inline">Utilización: {metrics.usagePercent}%</span>
             <span>100% Meta</span>
          </div>
        </div>

        {metrics.isNearLimit && (
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${metrics.isOverBudget ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
            <AlertCircle size={14} className="shrink-0" />
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight">
              {metrics.isOverBudget 
                ? `¡Presupuesto excedido por $${Math.abs(metrics.remaining).toLocaleString()}!` 
                : `Atención: Has utilizado el ${metrics.usagePercent}% de tu presupuesto total.`}
            </p>
          </div>
        )}
      </div>

      {/* Improved Expenses Table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-stone-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-800 serif">Historial de Gastos</h3>
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{expenses.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-stone-400 text-[9px] uppercase tracking-[0.2em] font-bold bg-stone-50/50">
                <th className="px-4 md:px-5 py-2.5">Concepto / Categoría</th>
                <th className="px-4 md:px-5 py-2.5 text-right">Monto Estimado</th>
                <th className="px-4 md:px-5 py-2.5 text-right">Gasto Real</th>
                <th className="px-4 md:px-5 py-2.5 text-center">Estado</th>
                <th className="px-4 md:px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {expenses.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/40 transition-all group">
                  <td className="px-4 md:px-5 py-3">
                    <p className="font-bold text-stone-800 text-xs md:text-sm serif leading-tight">{item.item}</p>
                    <span className="text-[9px] font-bold text-[#C6A75E] uppercase tracking-widest mt-0.5 block opacity-60">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 md:px-5 py-3 text-right">
                    <span className="text-[10px] font-medium text-stone-400">${item.estimated.toLocaleString()}</span>
                  </td>
                  <td className="px-4 md:px-5 py-3 text-right">
                    <span className="text-xs font-bold text-stone-800">${item.actual.toLocaleString()}</span>
                  </td>
                  <td className="px-4 md:px-5 py-3">
                    <div className="flex justify-center">
                      <span className={`px-2 md:px-2.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border ${
                        item.paid 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.paid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 md:opacity-0 group-hover:opacity-100 transition-all">
                      <button className="text-stone-200 hover:text-[#C6A75E] transition-colors">
                        <ICONS.Edit.type {...ICONS.Edit.props} size={12} />
                      </button>
                      <button 
                        onClick={() => onRemoveExpense(item.id)}
                        className="text-stone-200 hover:text-rose-500 transition-colors"
                      >
                        <ICONS.Trash.type {...ICONS.Trash.props} size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mx-auto mb-3">
                      <CreditCard size={24} />
                    </div>
                    <p className="text-stone-400 text-xs italic serif">Aún no has registrado ningún gasto.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal Redesign */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Añadir Nuevo Gasto"
        subtitle="Registra un gasto y actualiza tu control financiero"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Información Básica */}
            <div className="space-y-4 col-span-full">
              <div className="flex items-center gap-2 px-1">
                <Info size={12} className="text-[#C6A75E]" />
                <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Información Básica</h4>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest ml-1">Concepto o Item</label>
                <input 
                  type="text" required value={newItem.item} 
                  onChange={e => setNewItem({...newItem, item: e.target.value})} 
                  placeholder="Ej: Banquete de Gala, Arreglos Florales..."
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] focus:bg-white text-xs font-semibold text-stone-800 transition-all shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest ml-1">Categoría</label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] focus:bg-white text-xs font-bold text-stone-800 transition-all appearance-none cursor-pointer"
                    value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}
                  >
                    <option value="Lugar">Lugar</option>
                    <option value="Catering">Catering</option>
                    <option value="Decoración">Decoración</option>
                    <option value="Vestimenta">Vestimenta</option>
                    <option value="Otros">Otros</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Información Financiera */}
            <div className="space-y-4 col-span-full pt-4 border-t border-stone-50">
              <div className="flex items-center gap-2 px-1">
                {/* Fixed missing DollarSign icon */}
                <DollarSign size={12} className="text-[#C6A75E]" />
                <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Información Financiera</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest ml-1">Monto Real</label>
                  <input 
                    type="number" required
                    value={newItem.actual || ''} onChange={e => setNewItem({...newItem, actual: Number(e.target.value)})}
                    placeholder="$0.00"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] focus:bg-white text-xs font-bold text-[#0F1A2E] transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest ml-1">Estado de Pago</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setNewItem({...newItem, paid: true})}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${newItem.paid ? 'bg-[#0F1A2E] text-white border-transparent shadow-md' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}
                    >
                      Pagado
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNewItem({...newItem, paid: false})}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${!newItem.paid ? 'bg-[#C6A75E] text-white border-transparent shadow-md' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}
                    >
                      Pendiente
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Preview */}
            <div className="col-span-full p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#C6A75E] shadow-sm">
                     <TrendingUp size={14} />
                  </div>
                  <div>
                     <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Disponible después</p>
                     <p className="text-sm font-bold text-stone-800">
                       ${(metrics.remaining - newItem.actual).toLocaleString()}
                     </p>
                  </div>
               </div>
               {(metrics.remaining - newItem.actual) < 0 && (
                 <span className="text-[8px] font-bold text-rose-500 uppercase bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 animate-pulse">
                   ¡Supera el límite!
                 </span>
               )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 border-2 border-stone-100 rounded-xl text-stone-400 font-bold text-xs hover:bg-stone-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-[2] py-3 text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-[0.2em] uppercase text-[10px]"
              style={{ backgroundColor: COLORS.accent }}
            >
              Guardar Gasto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Subcomponentes Internos
const BudgetMetric = ({ label, value, icon, color, dark = false, status = 'normal' }: any) => {
  const statusColors = {
    normal: '',
    warning: 'ring-2 ring-amber-400 ring-offset-2',
    error: 'ring-2 ring-rose-400 ring-offset-2'
  };

  return (
    <div className={`p-3 sm:p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between h-24 sm:h-28 transition-all hover:shadow-md ${color} ${dark ? 'text-white' : 'text-stone-800'} ${statusColors[status as keyof typeof statusColors]}`}>
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${dark ? 'bg-white/10' : 'bg-white text-[#C6A75E]'}`}>
          {icon}
        </div>
        <ArrowUpRight className={dark ? 'text-white/20' : 'text-stone-200'} size={14} />
      </div>
      <div>
        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5 ${dark ? 'text-white/40' : 'text-stone-400'}`}>{label}</p>
        <h4 className="text-lg sm:text-xl font-bold serif leading-tight tracking-tight">{value}</h4>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, value }: { color: string, label: string, value: number }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{label} ({value}%)</span>
  </div>
);
