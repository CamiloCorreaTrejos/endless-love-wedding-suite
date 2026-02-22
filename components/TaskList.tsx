
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
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Editorial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-100 pb-8">
        <div>
          <h2 className="text-4xl font-bold text-stone-800 serif">Tareas Pendientes</h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-stone-400 text-sm">Organización táctica paso a paso</p>
            <div className="w-1 h-1 rounded-full bg-stone-200" />
            <span className="text-[10px] font-bold text-[#C6A75E] uppercase tracking-widest">
              {metrics.percent}% Completado
            </span>
          </div>
        </div>
        
        <button 
          onClick={openAddModal}
          className="bg-[#0F1A2E] text-white px-8 py-4 rounded-[1.5rem] text-xs font-bold flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.1em]"
        >
          {ICONS.Plus} Nueva Tarea
        </button>
      </div>

      {/* Strategic Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <TaskSummaryCard 
          label="Críticas" 
          value={metrics.highPriority} 
          icon={<AlertCircle size={18} />} 
          color="bg-rose-50" 
          textColor="text-rose-700"
          alert={metrics.highPriority > 0}
        />
        <TaskSummaryCard 
          label="Activas" 
          value={metrics.active} 
          icon={<Clock size={18} />} 
          color="bg-amber-50" 
          textColor="text-amber-700"
        />
        <TaskSummaryCard 
          label="Vencidas" 
          value={metrics.overdue} 
          icon={<Flag size={18} />} 
          color="bg-stone-50" 
          textColor="text-stone-800"
          alert={metrics.overdue > 0}
        />
        <TaskSummaryCard 
          label="Finalizadas" 
          value={metrics.completed} 
          icon={<CheckCircle2 size={18} />} 
          color="bg-emerald-50" 
          textColor="text-emerald-700"
        />
      </div>

      {/* Toolbar - Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <input 
            type="text" 
            placeholder="Buscar tarea por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] focus:bg-white text-sm text-stone-800 transition-all font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
           <FilterBtn label="Todas" active />
           <FilterBtn label="Pendientes" />
           <FilterBtn label="Completas" />
        </div>
      </div>

      {/* Task List - Editorial Style */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div 
            key={task.id} 
            className={`group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-6 bg-white border border-stone-100 rounded-[2rem] shadow-sm transition-all hover:shadow-md hover:border-[#C6A75E]/20 ${task.completed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Elegant Checkbox */}
              <button 
                onClick={() => onToggleTask(task.id)}
                className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 ${
                  task.completed 
                    ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-100' 
                    : 'bg-white border-stone-100 group-hover:border-[#C6A75E]'
                }`}
              >
                {task.completed && <CheckCircle2 size={20} className="text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                 <h4 className={`text-base md:text-lg font-bold serif transition-all ${task.completed ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                   {task.title}
                 </h4>
                 <div className="flex items-center gap-4 mt-1.5">
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <CalendarIcon size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {new Date(task.dueDate) < new Date() && !task.completed && (
                      <span className="text-[9px] font-bold text-rose-500 uppercase bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">Vencida</span>
                    )}
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 mt-2 sm:mt-0 ml-14 sm:ml-0">
              <PriorityBadge priority={task.priority} />
              
              <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => openEditModal(task)}
                  className="p-3 text-stone-300 hover:text-[#0F1A2E] hover:bg-stone-50 rounded-xl transition-all shadow-sm"
                >
                  {ICONS.Edit}
                </button>
                <button 
                  onClick={() => onRemoveTask(task.id)}
                  className="p-3 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <ICONS.Trash.type {...ICONS.Trash.props} size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
           <div className="py-24 text-center bg-stone-50/50 rounded-[3rem] border border-dashed border-stone-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-stone-200 mx-auto mb-6 shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-xl font-bold text-stone-800 serif">Todo en orden</h4>
              <p className="text-stone-400 text-sm mt-2 serif italic px-8">No hay tareas pendientes en esta categoría.</p>
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
        <form onSubmit={handleSave} className="space-y-8">
          {/* Bloque: Información Básica */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
               <ICONS.AI.type {...ICONS.AI.props} size={14} className="text-[#C6A75E]" />
               <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Información Básica</h4>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">¿Qué hay que hacer?</label>
              <input 
                type="text" required value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Ej: Contratar transporte para invitados, sesión de fotos..."
                className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] focus:bg-white text-sm font-semibold text-stone-800 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Layout Dos Columnas: Gestión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 border-t border-stone-50">
            {/* Columna: Fecha */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <CalendarIcon size={14} className="text-[#C6A75E]" />
                 <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Fecha Límite</h4>
              </div>
              
              <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl transition-all text-stone-400"><ChevronLeft size={16} /></button>
                  <span className="text-[11px] font-bold text-stone-800 uppercase tracking-tighter">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                  <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl transition-all text-stone-400"><ChevronRight size={16} /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {daysOfWeek.map(d => <span key={d} className="text-[9px] font-bold text-stone-300">{d}</span>)}
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} />;
                    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = dueDate === dateStr;

                    return (
                      <button
                        key={`day-${idx}`} type="button" onClick={() => handleDateSelect(day)}
                        className={`h-9 w-9 text-[11px] font-bold rounded-xl flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-[#0F1A2E] text-white shadow-xl scale-110' 
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
                 <span className="text-[9px] font-bold text-stone-400 uppercase">Selección:</span>
                 <span className="text-[10px] font-bold text-[#C6A75E]">{dueDate}</span>
              </div>
            </div>

            {/* Columna: Prioridad */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <Flag size={14} className="text-[#C6A75E]" />
                 <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Prioridad Estratégica</h4>
              </div>
              <div className="flex flex-col gap-3">
                {(['Low', 'Medium', 'High'] as const).map((p) => (
                  <button
                    key={p} type="button" onClick={() => setPriority(p)}
                    className={`w-full py-4 px-6 rounded-2xl border-2 text-[11px] font-bold transition-all text-left flex items-center justify-between uppercase tracking-wider ${
                      priority === p 
                        ? 'bg-[#0F1A2E] text-white border-transparent shadow-xl' 
                        : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100 hover:text-stone-600'
                    }`}
                  >
                    {p === 'High' ? 'Crítica' : (p === 'Medium' ? 'Media' : 'Informativa')}
                    <ArrowRight size={14} className={priority === p ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botonera */}
          <div className="flex gap-4 pt-6">
            <button 
              type="button" onClick={() => setIsModalOpen(false)}
              className="flex-1 py-5 border-2 border-stone-100 rounded-[1.8rem] text-stone-400 font-bold text-sm hover:bg-stone-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-[2] py-5 text-white font-bold rounded-[1.8rem] shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-[0.2em] uppercase text-xs"
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
  <div className={`p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-lg ${color}`}>
    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-sm ${alert ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-stone-400'}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">{label}</p>
      <h4 className={`text-3xl font-bold serif leading-none ${textColor}`}>{value}</h4>
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
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] border ${styles}`}>
      {labels}
    </span>
  );
};

const FilterBtn = ({ label, active = false }: { label: string, active?: boolean }) => (
  <button className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-[#0F1A2E] text-white shadow-md' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}`}>
    {label}
  </button>
);
