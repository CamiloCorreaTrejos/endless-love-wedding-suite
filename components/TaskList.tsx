
import React, { useState, useMemo } from 'react';
import { ICONS, COLORS } from '../constants';
import { Task } from '../types';
import { Modal } from './Modal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  X, 
  Search, 
  Filter,
  MoreVertical,
  Flag,
  ArrowRight
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onRemoveTask: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleTask, onAddTask, onUpdateTask, onRemoveTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Estado para el calendario personalizado
  const [viewDate, setViewDate] = useState(new Date());

  const daysOfWeek = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Métricas Estratégicas
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const highPriority = tasks.filter(t => t.priority === 'High' && !t.completed).length;
    const overdue = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;

    return { total, completed, active, highPriority, overdue, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        // Orden: Primero incompletas, luego por fecha
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, searchTerm]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewDate]);

  const handleDateSelect = (day: number) => {
    const year = viewDate.getFullYear();
    const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    setDueDate(`${year}-${month}-${dayStr}`);
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const openAddModal = () => {
    setEditingTaskId(null);
    setTitle('');
    const today = new Date();
    setDueDate(today.toISOString().split('T')[0]);
    setViewDate(today);
    setPriority('Medium');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDueDate(task.dueDate);
    setViewDate(new Date(task.dueDate));
    setPriority(task.priority);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTaskId) {
      onUpdateTask(editingTaskId, { title, dueDate, priority });
    } else {
      onAddTask({ title, dueDate, priority });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-700">
      {/* Header Editorial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 serif">Tareas Pendientes</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-stone-400 text-xs">Organización táctica paso a paso</p>
            <div className="w-1 h-1 rounded-full bg-stone-200" />
            <span className="text-[9px] font-bold text-[#C6A75E] uppercase tracking-widest">
              {metrics.percent}% Completado
            </span>
          </div>
        </div>
        
        <button 
          onClick={openAddModal}
          className="bg-[#0F1A2E] text-white px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.1em]"
        >
          {ICONS.Plus} Nueva Tarea
        </button>
      </div>

      {/* Strategic Summary Metrics Unified */}
      <div className="bg-stone-100 rounded-2xl border border-stone-100 shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-4 gap-px">
        {[
          { label: 'Críticas', value: metrics.highPriority, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', alert: metrics.highPriority > 0 },
          { label: 'Activas', value: metrics.active, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Vencidas', value: metrics.overdue, icon: Flag, color: 'text-stone-800', bg: 'bg-stone-200', alert: metrics.overdue > 0 },
          { label: 'Finalizadas', value: metrics.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4 flex flex-col h-full relative group transition-colors hover:bg-stone-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${m.alert ? 'bg-rose-500 text-white animate-pulse' : m.bg + ' ' + m.color}`}>
                  <m.icon size={14} />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{m.label}</p>
              </div>
            </div>
            <div className="mt-auto">
              <h4 className={`text-2xl font-bold serif leading-tight ${m.color}`}>{m.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar - Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white p-2 rounded-xl border border-stone-100 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <input 
            type="text" 
            placeholder="Buscar tarea por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-100 rounded-lg outline-none focus:border-[#C6A75E] focus:bg-white text-xs text-stone-800 transition-all font-medium"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
           <FilterBtn label="Todas" active />
           <FilterBtn label="Pendientes" />
           <FilterBtn label="Completas" />
        </div>
      </div>

      {/* Task List - Editorial Style */}
      <div className="space-y-2 sm:space-y-2.5">
        {filteredTasks.map((task) => (
          <div 
            key={task.id} 
            className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-white border border-stone-100 rounded-xl shadow-sm transition-all hover:shadow hover:border-[#C6A75E]/20 ${task.completed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Elegant Checkbox */}
              <button 
                onClick={() => onToggleTask(task.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                  task.completed 
                    ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-100' 
                    : 'bg-white border-stone-100 group-hover:border-[#C6A75E]'
                }`}
              >
                {task.completed && <CheckCircle2 size={14} className="text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                 <h4 className={`text-sm font-bold serif transition-all ${task.completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                   {task.title}
                 </h4>
                 <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-stone-400">
                      <CalendarIcon size={10} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {new Date(task.dueDate) < new Date() && !task.completed && (
                      <span className="text-[8px] font-bold text-rose-500 uppercase bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">Vencida</span>
                    )}
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 mt-1 sm:mt-0 ml-9 sm:ml-0">
              <PriorityBadge priority={task.priority} />
              
              <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(task)}
                  className="p-2 text-blue-700 hover:text-white hover:bg-blue-600 rounded-lg shadow-sm transition-all bg-blue-100 border border-blue-200" title="Editar"
                >
                  <ICONS.Edit.type {...ICONS.Edit.props} size={14} />
                </button>
                <button 
                  onClick={() => onRemoveTask(task.id)}
                  className="p-2 text-rose-700 hover:text-white hover:bg-rose-600 rounded-lg shadow-sm transition-all bg-rose-100 border border-rose-200" title="Eliminar"
                >
                  <ICONS.Trash.type {...ICONS.Trash.props} size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
           <div className="py-8 text-center bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-stone-200 mx-auto mb-3 shadow-sm">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-base font-bold text-stone-800 serif">Todo en orden</h4>
              <p className="text-stone-400 text-xs mt-1 serif italic px-6">No hay tareas pendientes en esta categoría.</p>
           </div>
        )}
      </div>

      {/* Modal Redesign: Nueva Tarea */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingTaskId ? 'Detalle de Tarea' : 'Nueva Tarea'}
        subtitle="Agrega una acción y mantén el control del evento"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Bloque: Información Básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
               <ICONS.AI.type {...ICONS.AI.props} size={12} className="text-[#C6A75E]" />
               <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Información Básica</h4>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest ml-1">¿Qué hay que hacer?</label>
              <input 
                type="text" required value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Ej: Contratar transporte para invitados, sesión de fotos..."
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] focus:bg-white text-xs font-semibold text-stone-800 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Layout Dos Columnas: Gestión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-50">
            {/* Columna: Fecha */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                 <CalendarIcon size={12} className="text-[#C6A75E]" />
                 <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Fecha Límite</h4>
              </div>
              
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-stone-400"><ChevronLeft size={14} /></button>
                  <span className="text-[10px] font-bold text-stone-800 uppercase tracking-tighter">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                  <button type="button" onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-stone-400"><ChevronRight size={14} /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                  {daysOfWeek.map(d => <span key={d} className="text-[8px] font-bold text-stone-300">{d}</span>)}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} />;
                    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = dueDate === dateStr;

                    return (
                      <button
                        key={`day-${idx}`} type="button" onClick={() => handleDateSelect(day)}
                        className={`h-7 w-7 text-[10px] font-bold rounded-lg flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-[#0F1A2E] text-white shadow-md scale-110' 
                            : 'hover:bg-white text-stone-600'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="px-1 flex items-center justify-between">
                 <span className="text-[8px] font-bold text-stone-400 uppercase">Selección:</span>
                 <span className="text-[9px] font-bold text-[#C6A75E]">{dueDate}</span>
              </div>
            </div>

            {/* Columna: Prioridad */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                 <Flag size={12} className="text-[#C6A75E]" />
                 <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Prioridad Estratégica</h4>
              </div>
              <div className="flex flex-col gap-2">
                {(['Low', 'Medium', 'High'] as const).map((p) => (
                  <button
                    key={p} type="button" onClick={() => setPriority(p)}
                    className={`w-full py-2.5 px-4 rounded-xl border-2 text-[10px] font-bold transition-all text-left flex items-center justify-between uppercase tracking-wider ${
                      priority === p 
                        ? 'bg-[#0F1A2E] text-white border-transparent shadow-md' 
                        : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100 hover:text-stone-600'
                    }`}
                  >
                    {p === 'High' ? 'Crítica' : (p === 'Medium' ? 'Media' : 'Informativa')}
                    <ArrowRight size={12} className={priority === p ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botonera */}
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
              {editingTaskId ? 'Actualizar Tarea' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Subcomponentes Internos Refinados
const TaskSummaryCard = ({ label, value, icon, color, textColor, alert = false }: any) => (
  <div className={`p-3 sm:p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-3 transition-all hover:shadow-md ${color}`}>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${alert ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-stone-400'}`}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] uppercase font-bold text-stone-400 tracking-widest mb-0.5">{label}</p>
      <h4 className={`text-xl font-bold serif leading-none ${textColor}`}>{value}</h4>
    </div>
  </div>
);

const PriorityBadge = ({ priority }: { priority: 'Low' | 'Medium' | 'High' }) => {
  const styles = {
    High: 'bg-rose-50 text-rose-600 border-rose-100',
    Medium: 'bg-amber-50 text-amber-600 border-amber-100',
    Low: 'bg-stone-50 text-stone-500 border-stone-100'
  }[priority];
  
  const labels = { High: 'Alta', Medium: 'Media', Low: 'Baja' }[priority];

  return (
    <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-[0.1em] border ${styles}`}>
      {labels}
    </span>
  );
};

const FilterBtn = ({ label, active = false }: { label: string, active?: boolean }) => (
  <button className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-[#0F1A2E] text-white shadow-sm' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}`}>
    {label}
  </button>
);
