
import React, { useState, useRef, useMemo } from 'react';
import { ICONS, COLORS, GUEST_CATEGORIES } from '../constants';
import { Guest, GuestMember, Table } from '../types';
import { Modal } from './Modal';
// Added Plus to the lucide-react imports to fix the error on line 369
import { LayoutPanelTop, Search, Filter, UserPlus, Users2, MoreHorizontal, ArrowUpRight, Plus } from 'lucide-react';

interface GuestListProps {
  guests: Guest[];
  tables: Table[];
  onAddGuest: (guest: Omit<Guest, 'id'>) => void;
  onRemoveGuest: (id: string) => void;
  onUpdateGuest: (id: string, updates: Partial<Guest>) => void;
}

type GuestEntryType = 'Solo' | 'Pareja' | 'Grupo Familiar';

export const GuestList: React.FC<GuestListProps> = ({ guests, tables, onAddGuest, onRemoveGuest, onUpdateGuest }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [entryType, setEntryType] = useState<GuestEntryType>('Solo');
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState('Familia de Camilo');
  const [certainty, setCertainty] = useState<'Seguro' | 'Tal vez'>('Seguro');
  const [status, setStatus] = useState<'Pendiente' | 'Invitación Enviada' | 'Cancelado'>('Pendiente');
  const [confirmation, setConfirmation] = useState<'Sí' | 'No'>('No');
  
  const [members, setMembers] = useState<Partial<GuestMember>[]>([
    { name: '', ageCategory: 'Adulto', isUnknown: false }
  ]);

  const resetForm = () => {
    setEditingGuestId(null);
    setEntryType('Solo');
    setGroupName('');
    setCategory('Familia de Camilo');
    setCertainty('Seguro');
    setStatus('Pendiente');
    setConfirmation('No');
    setMembers([{ name: '', ageCategory: 'Adulto', isUnknown: false }]);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setGroupName(guest.groupName);
    setCategory(guest.category);
    setCertainty(guest.certainty);
    setStatus(guest.status as any);
    setConfirmation(guest.confirmation);
    setMembers(guest.members.map(m => ({ ...m })));
    setEntryType(guest.members.length === 1 ? 'Solo' : (guest.members.length === 2 ? 'Pareja' : 'Grupo Familiar'));
    setIsModalOpen(true);
  };

  const handleAddMemberField = () => {
    setMembers([...members, { name: '', ageCategory: 'Adulto', isUnknown: false }]);
  };

  const updateMember = (index: number, updates: Partial<GuestMember>) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], ...updates };
    setMembers(newMembers);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMembers: GuestMember[] = members.map(m => ({
      id: m.id || Math.random().toString(36).substr(2, 9),
      name: m.isUnknown ? 'Desconocido' : (m.name || 'Invitado'),
      ageCategory: m.ageCategory || 'Adulto',
      isUnknown: m.isUnknown
    }));

    const guestData: Omit<Guest, 'id'> = {
      groupName: groupName || finalMembers.map(m => m.name).join(' & '),
      category,
      members: finalMembers,
      certainty,
      status,
      confirmation,
      maxGuests: finalMembers.length,
      rsvpCode: '',
      rsvpStatus: 'pendiente',
      rsvpClosed: false
    };

    if (editingGuestId) {
      onUpdateGuest(editingGuestId, guestData);
    } else {
      onAddGuest(guestData);
    }
    setIsModalOpen(false);
  };

  const categories = ['Todos', ...GUEST_CATEGORIES];
  
  const filteredGuests = useMemo(() => {
  const term = (searchTerm ?? '').toLowerCase();

  return guests.filter(g => {
    const matchesFilter = filter === 'Todos' || (g.category ?? '') === filter;

    const group = (g.groupName ?? '').toLowerCase();
    const membersMatch = (g.members ?? []).some(m => ((m.name ?? '')).toLowerCase().includes(term));

    const matchesSearch = group.includes(term) || membersMatch;

    return matchesFilter && matchesSearch;
  });
}, [guests, filter, searchTerm]);

  // Calculations for Summary
  const allMembersList = guests.flatMap(inv => inv.members);
  const totalPersonas = allMembersList.length;
  const confirmadasPersonas = guests
    .filter(inv => inv.confirmation === 'Sí')
    .reduce((acc, inv) => acc + inv.members.length, 0);
  
  const assignedIdsSet = new Set(tables.flatMap(t => t.assignedGuestIds));
  const miembrosSinMesaCount = allMembersList.filter(m => !assignedIdsSet.has(m.id)).length;
  const segurasPersonas = guests
    .filter(inv => inv.certainty === 'Seguro')
    .reduce((acc, inv) => acc + inv.members.length, 0);

  const getAssignedTableNames = (guestMembers: GuestMember[]) => {
    const tableNames = new Set<string>();
    guestMembers.forEach(member => {
      const assignedTable = tables.find(t => t.assignedGuestIds.includes(member.id));
      if (assignedTable) {
        tableNames.add(assignedTable.name);
      }
    });
    return Array.from(tableNames);
  };

  return (
    <div className="space-y-8 md:space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 serif">Invitados</h2>
          <p className="text-stone-400 text-sm mt-1">Supervisa y organiza el corazón de tu celebración</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input type="file" ref={fileInputRef} className="hidden" />
          <button className="w-full sm:w-auto bg-white border border-stone-200 text-stone-500 px-6 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-stone-50 shadow-sm transition-all uppercase tracking-widest">
            {ICONS.Upload} Importar CSV
          </button>
          <button 
            onClick={openAddModal}
            className="w-full sm:w-auto bg-[#0F1A2E] text-white px-7 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest"
          >
            {ICONS.Plus} Nuevo Registro
          </button>
        </div>
      </div>

      {/* Stats Summary - Dashboard Consistent Style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <SummaryCard label="Total Invitados" value={totalPersonas} icon={<Users2 size={18} />} color="bg-stone-50" />
        <SummaryCard label="Confirmadas" value={confirmadasPersonas} icon={<ICONS.Check.type {...ICONS.Check.props} />} color="bg-emerald-50" badgeColor="text-emerald-600" />
        <SummaryCard label="Sin Mesa" value={miembrosSinMesaCount} icon={<LayoutPanelTop size={18} />} color="bg-amber-50" badgeColor="text-amber-600" alert={miembrosSinMesaCount > 0} />
        <SummaryCard label="Seguras" value={segurasPersonas} icon={<ArrowUpRight size={18} />} color="bg-blue-50" badgeColor="text-blue-600" />
        <SummaryCard label="En duda" value={totalPersonas - segurasPersonas} icon={<Filter size={18} />} color="bg-rose-50" badgeColor="text-rose-600" />
      </div>

      {/* Toolbar - Search & Filter */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 md:p-5 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-sm">
        <div className="relative w-full lg:w-96">
          <input 
            type="text" 
            placeholder="Buscar por grupo o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 md:py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] focus:bg-white text-sm text-stone-800 transition-all font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-2 hidden sm:block">Categoría:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 lg:flex-none px-4 md:px-6 py-3 md:py-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-600 outline-none focus:border-[#C6A75E] transition-all min-w-[150px] md:min-w-[200px]"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-stone-50/50 border-b border-stone-100">
              <tr className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                <th className="px-6 py-4 w-1/3">Invitados</th>
                <th className="px-4 py-4">Categoría</th>
                <th className="px-4 py-4">Asignación</th>
                <th className="px-4 py-4">Certeza</th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-4 py-4 text-center">RSVP</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredGuests.map((inv) => {
                const assignedTables = getAssignedTableNames(inv.members);
                return (
                  <tr key={inv.id} className="hover:bg-stone-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-800 text-sm serif leading-tight">
                        {inv.members.map(m => m.name).join(' & ')}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {inv.members.map((m, i) => (
                          <span key={m.id || i} className={`text-[8px] px-1.5 py-0.5 rounded-lg border font-bold uppercase tracking-tighter ${m.isUnknown ? 'border-stone-100 text-stone-300 italic' : 'border-stone-100 bg-stone-50 text-stone-500'}`}>
                            {m.ageCategory}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select 
                        value={inv.category} 
                        onChange={(e) => onUpdateGuest(inv.id, { category: e.target.value })}
                        className="text-[9px] font-bold uppercase text-stone-500 bg-stone-50 border border-stone-100 rounded-xl px-2 py-1.5 focus:border-[#C6A75E] outline-none cursor-pointer transition-all hover:bg-white"
                      >
                        {GUEST_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {assignedTables.length > 0 ? (
                          assignedTables.map((name, i) => (
                            <span key={`${inv.id}-table-${i}`} className="text-[9px] font-bold px-2 py-1 bg-[#0F1A2E]/5 text-[#0F1A2E] rounded-lg border border-[#0F1A2E]/10 flex items-center gap-1">
                              <LayoutPanelTop size={8} /> {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1">
                            <MoreHorizontal size={8} /> S/A
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                       <select 
                          value={inv.certainty} 
                          onChange={(e) => onUpdateGuest(inv.id, { certainty: e.target.value as any })}
                          className={`text-[9px] font-bold uppercase rounded-xl px-2 py-1.5 outline-none border transition-all ${inv.certainty === 'Seguro' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}
                        >
                          <option value="Seguro">Seguro</option>
                          <option value="Tal vez">Tal vez</option>
                        </select>
                    </td>
                    <td className="px-4 py-4">
                      <select 
                        value={inv.status} 
                        onChange={(e) => onUpdateGuest(inv.id, { status: e.target.value as any })}
                        className="text-[9px] font-bold uppercase text-stone-500 bg-stone-50 border border-stone-100 rounded-xl px-2 py-1.5 focus:border-[#C6A75E] outline-none"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Invitación Enviada">Enviada</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <select 
                        value={inv.confirmation} 
                        onChange={(e) => onUpdateGuest(inv.id, { confirmation: e.target.value as any })}
                        className={`text-[9px] font-bold uppercase rounded-xl px-3 py-1.5 outline-none border transition-all cursor-pointer ${inv.confirmation === 'Sí' ? 'bg-[#C6A75E] text-white border-[#C6A75E] shadow-sm' : 'bg-stone-50 text-stone-400 border-stone-100'}`}
                      >
                        <option value="No">Pendiente</option>
                        <option value="Sí">Confirmado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(inv)} className="p-2 text-stone-300 hover:text-[#C6A75E] hover:bg-white rounded-xl shadow-sm transition-all bg-stone-50 border border-stone-50">
                          {ICONS.Edit}
                        </button>
                        <button onClick={() => onRemoveGuest(inv.id)} className="p-2 text-stone-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          {ICONS.Trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredGuests.length === 0 && (
                 <tr>
                   <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mx-auto mb-4">
                        <Users2 size={36} />
                      </div>
                      <p className="text-stone-400 text-sm italic serif">No se encontraron invitados que coincidan con los criterios.</p>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup - Consistent with Luxury UI */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingGuestId ? 'Editar Registro' : 'Añadir Registro'}
        subtitle="Gestión de Invitación"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {!editingGuestId && (
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Tipo de Entrada</label>
              <div className="flex flex-col sm:flex-row gap-2">
                {(['Solo', 'Pareja', 'Grupo Familiar'] as GuestEntryType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setEntryType(type);
                      if (type === 'Solo') setMembers([members[0]]);
                      else if (type === 'Pareja' && members.length < 2) setMembers([members[0], { name: '', ageCategory: 'Adulto', isUnknown: false }]);
                    }}
                    className={`flex-1 flex flex-row sm:flex-col items-center justify-center gap-3 sm:gap-2 py-4 sm:py-5 px-4 rounded-[1.5rem] border-2 text-[11px] font-bold transition-all uppercase tracking-tighter ${entryType === type ? 'bg-[#0F1A2E] text-white border-transparent shadow-xl' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}
                  >
                    {type === 'Solo' ? <UserPlus size={18} /> : <Users2 size={18} />}
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Nombre del Grupo</label>
              <input 
                type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Ej: Familia Rivera..."
                className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] focus:bg-white text-sm text-stone-900 font-semibold shadow-inner transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Categoría</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] focus:bg-white text-sm text-stone-900 font-bold transition-all"
              >
                {GUEST_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Integrantes del grupo</label>
              {entryType === 'Grupo Familiar' && (
                <button 
                  type="button" onClick={handleAddMemberField}
                  className="text-[10px] font-bold text-[#C6A75E] uppercase flex items-center gap-1 hover:text-[#0F1A2E] transition-colors"
                >
                  <Plus size={12} /> Añadir miembro
                </button>
              )}
            </div>

            {members.map((m, idx) => (
              <div key={m.id || idx} className="p-5 md:p-6 bg-stone-50 border border-stone-100 rounded-[1.5rem] md:rounded-[2rem] space-y-5 shadow-inner group">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Invitado {idx + 1}</h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" checked={m.isUnknown} onChange={e => updateMember(idx, { isUnknown: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#0F1A2E]"
                      />
                      <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Desconocido</span>
                    </label>
                    {members.length > 1 && (
                      <button 
                        type="button" onClick={() => setMembers(members.filter((_, i) => i !== idx))}
                        className="text-stone-300 hover:text-rose-500 transition-colors"
                      >
                        {ICONS.Trash}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <input 
                      type="text" value={m.name} disabled={m.isUnknown}
                      onChange={e => updateMember(idx, { name: e.target.value })}
                      placeholder={m.isUnknown ? "Invitado por confirmar" : "Nombre completo"}
                      className="w-full px-5 py-4 bg-white border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] text-sm text-stone-800 placeholder-stone-400 disabled:bg-stone-100 disabled:text-stone-300 font-semibold"
                    />
                  </div>
                  <select 
                    value={m.ageCategory} onChange={e => updateMember(idx, { ageCategory: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] text-sm text-stone-800 font-bold"
                  >
                    <option value="Adulto">Adulto</option>
                    <option value="Niño">Niño</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-8 border-t border-stone-50">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Certeza</label>
              <select 
                value={certainty} onChange={e => setCertainty(e.target.value as any)}
                className="w-full px-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-[10px] font-bold uppercase text-stone-800 outline-none focus:border-[#C6A75E] focus:bg-white"
              >
                <option value="Seguro">Seguro</option>
                <option value="Tal vez">Tal vez</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Invitación</label>
              <select 
                value={status} onChange={e => setStatus(e.target.value as any)}
                className="w-full px-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-[10px] font-bold uppercase text-stone-800 outline-none focus:border-[#C6A75E] focus:bg-white"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Invitación Enviada">Enviada</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Confirmación</label>
              <select 
                value={confirmation} onChange={e => setConfirmation(e.target.value as any)}
                className="w-full px-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-[10px] font-bold uppercase text-stone-800 outline-none focus:border-[#C6A75E] focus:bg-white"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-10">
            <button 
              type="button" onClick={() => setIsModalOpen(false)}
              className="w-full sm:flex-1 py-5 border-2 border-stone-100 rounded-[1.8rem] text-stone-400 font-bold text-sm hover:bg-stone-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="w-full sm:flex-[2] py-5 text-white font-bold rounded-[1.8rem] shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-xs"
              style={{ backgroundColor: COLORS.accent }}
            >
              {editingGuestId ? 'Actualizar Registro' : 'Registrar Invitación'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Subcomponentes Refinados
const SummaryCard = ({ label, value, icon, color, badgeColor, alert = false }: any) => (
  <div className={`p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col justify-between h-36 transition-all hover:shadow-md ${color}`}>
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
        {icon}
      </div>
      {alert && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">{label}</p>
      <h4 className={`text-2xl font-bold ${badgeColor || 'text-stone-800'}`}>{value}</h4>
    </div>
  </div>
);
