
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ICONS, COLORS, GUEST_CATEGORIES } from '../constants';
import { Guest, GuestMember, Table } from '../types';
import { Modal } from './Modal';
// Added Plus to the lucide-react imports to fix the error on line 369
import { LayoutPanelTop, Search, Filter, UserPlus, Users2, MoreHorizontal, ArrowUpRight, Plus, Download, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  getAgeCategoryLabel, getGuestCategoryLabel, getStatusLabel, getCertaintyLabel, getRsvpStatusLabel, getConfirmationLabel,
  parseAgeCategoryInput, parseGuestCategoryInput, parseStatusInput, parseCertaintyInput, parseRsvpStatusInput, parseConfirmationInput
} from '../src/lib/guestMappers';

interface GuestListProps {
  guests: Guest[];
  tables: Table[];
  onAddGuest: (guest: Omit<Guest, 'id'>) => void | Promise<void>;
  onRemoveGuest: (id: string) => void;
  onUpdateGuest: (id: string, updates: Partial<Guest>) => void;
}

type GuestEntryType = 'Solo' | 'Pareja' | 'Grupo Familiar';

export const GuestList: React.FC<GuestListProps> = ({ guests, tables, onAddGuest, onRemoveGuest, onUpdateGuest }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [filterAsignacion, setFilterAsignacion] = useState('Todos');
  const [filterCerteza, setFilterCerteza] = useState('Todos');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterRsvp, setFilterRsvp] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [entryType, setEntryType] = useState<GuestEntryType>('Solo');
  const [groupName, setGroupName] = useState('');
  const [category, setCategory] = useState('familia_camilo');
  const [certainty, setCertainty] = useState('seguro');
  const [status, setStatus] = useState('pendiente');
  const [confirmation, setConfirmation] = useState('no');
  const [rsvpStatus, setRsvpStatus] = useState('pendiente');
  
  const [members, setMembers] = useState<Partial<GuestMember>[]>([
    { name: '', ageCategory: 'adulto', isUnknown: false }
  ]);

  const resetForm = () => {
    setEditingGuestId(null);
    setEntryType('Solo');
    setGroupName('');
    setCategory('familia_camilo');
    setCertainty('seguro');
    setStatus('pendiente');
    setConfirmation('no');
    setRsvpStatus('pendiente');
    setMembers([{ name: '', ageCategory: 'adulto', isUnknown: false }]);
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
    setStatus(guest.status);
    setConfirmation(parseConfirmationInput(guest.confirmation));
    setRsvpStatus(guest.rsvpStatus || 'pendiente');
    setMembers(guest.members.map(m => ({ ...m })));
    setEntryType(guest.members.length === 1 ? 'Solo' : (guest.members.length === 2 ? 'Pareja' : 'Grupo Familiar'));
    setIsModalOpen(true);
  };

  const handleAddMemberField = () => {
    setMembers([...members, { 
      name: '', 
      ageCategory: 'adulto', 
      isUnknown: false,
      attending: undefined,
      email: '',
      dietaryRestrictions: '',
      rsvpNotes: ''
    }]);
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
      ageCategory: m.ageCategory || 'adulto',
      isUnknown: m.isUnknown,
      attending: m.attending,
      tableId: m.tableId,
      dietaryRestrictions: m.dietaryRestrictions,
      rsvpNotes: m.rsvpNotes
    }));

    if (editingGuestId) {
      const existingGuest = guests.find(g => g.id === editingGuestId);
      
      let newRsvpStatus = existingGuest?.rsvpStatus || 'pendiente';
      const attendingCount = finalMembers.filter(m => m.attending === true).length;
      const notAttendingCount = finalMembers.filter(m => m.attending === false).length;
      const totalMembers = finalMembers.length;

      if (existingGuest?.rsvpClosed) {
        newRsvpStatus = existingGuest.rsvpStatus; // Keep it as is if closed manually
      } else if (notAttendingCount === totalMembers && totalMembers > 0) {
        newRsvpStatus = 'rechazado';
      } else if (attendingCount === totalMembers && totalMembers > 0) {
        newRsvpStatus = 'confirmado';
      } else if (attendingCount > 0) {
        newRsvpStatus = 'parcial';
      } else {
        newRsvpStatus = 'pendiente';
      }

      const guestData: Partial<Guest> = {
        groupName: groupName || finalMembers.map(m => m.name).join(' & '),
        category,
        members: finalMembers,
        certainty,
        status,
        confirmation,
        maxGuests: finalMembers.length,
        rsvpStatus: newRsvpStatus,
        rsvpClosed: existingGuest?.rsvpClosed || false
      };
      onUpdateGuest(editingGuestId, guestData);
    } else {
      const guestData: Omit<Guest, 'id'> = {
        groupName: groupName || finalMembers.map(m => m.name).join(' & '),
        category,
        members: finalMembers,
        certainty,
        status,
        confirmation,
        maxGuests: finalMembers.length,
        rsvpCode: '',
        rsvpStatus: rsvpStatus,
        rsvpClosed: false
      };
      onAddGuest(guestData);
    }
    setIsModalOpen(false);
  };

  const categories = ['Todos', ...GUEST_CATEGORIES];
  const asignacionOptions = ['Todos', 'Asignado', 'Sin Asignar'];
  const certezaOptions = ['Todos', 'Seguro', 'Tal vez', 'Pendiente'];
  const estadoOptions = ['Todos', 'Pendiente', 'Enviada', 'Confirmado', 'Cancelado'];
  const rsvpOptions = ['Todos', 'Pendiente', 'Confirmado', 'Rechazado'];

  const assignedIdsSet = useMemo(() => new Set(tables.flatMap(t => t.assignedGuestIds)), [tables]);

  const getAssignedTableNames = (guestMembers: GuestMember[]) => {
    const tableNames = new Set<string>();
    guestMembers.forEach(member => {
      const assignedTable = tables.find(t => (t.assignedGuestIds || []).includes(member.id));
      if (assignedTable) {
        tableNames.add(assignedTable.name);
      }
    });
    return Array.from(tableNames);
  };
  
  const filteredGuests = useMemo(() => {
    const term = (searchTerm ?? '').toLowerCase();

    return guests.filter(g => {
      const matchesCategory = filter === 'Todos' || getGuestCategoryLabel(g.category ?? '') === filter;
      
      const isAssigned = g.members.some(m => assignedIdsSet.has(m.id));
      const matchesAsignacion = filterAsignacion === 'Todos' || 
                                (filterAsignacion === 'Asignado' && isAssigned) || 
                                (filterAsignacion === 'Sin Asignar' && !isAssigned);

      const matchesCerteza = filterCerteza === 'Todos' || getCertaintyLabel(g.certainty ?? '') === filterCerteza;
      const matchesEstado = filterEstado === 'Todos' || getStatusLabel(g.status ?? '') === filterEstado;
      const matchesRsvp = filterRsvp === 'Todos' || getRsvpStatusLabel(g.rsvpStatus ?? '') === filterRsvp;

      const group = (g.groupName ?? '').toLowerCase();
      const membersMatch = (g.members ?? []).some(m => ((m.name ?? '')).toLowerCase().includes(term));

      const matchesSearch = group.includes(term) || membersMatch;

      return matchesCategory && matchesAsignacion && matchesCerteza && matchesEstado && matchesRsvp && matchesSearch;
    });
  }, [guests, filter, filterAsignacion, filterCerteza, filterEstado, filterRsvp, searchTerm, assignedIdsSet]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, filterAsignacion, filterCerteza, filterEstado, filterRsvp, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredGuests.length / pageSize);
  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGuests.slice(start, start + pageSize);
  }, [filteredGuests, currentPage, pageSize]);

  const activeFiltersCount = [
    filter !== 'Todos',
    filterAsignacion !== 'Todos',
    filterCerteza !== 'Todos',
    filterEstado !== 'Todos',
    filterRsvp !== 'Todos'
  ].filter(Boolean).length;

  // Calculations for Summary
  const allMembersList = guests.flatMap(inv => inv.members);
  const totalPersonas = allMembersList.length;
  const confirmadasPersonas = allMembersList.filter(m => m.attending === true).length;
  
  const miembrosSinMesaCount = allMembersList.filter(m => !assignedIdsSet.has(m.id)).length;
  const segurasPersonas = guests
    .filter(inv => parseCertaintyInput(inv.certainty) === 'seguro')
    .reduce((acc, inv) => acc + inv.members.length, 0);

  const downloadTemplate = () => {
    const templateData = [
      {
        group_name: 'Familia Ejemplo',
        member_name: 'Juan Pérez',
        age_category: 'Adulto',
        category: 'Familia de Camilo',
        certainty: 'Seguro',
        status: 'Pendiente',
        confirmation: 'No'
      }
    ];

    try {
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
      
      XLSX.writeFile(workbook, 'plantilla_invitados.csv');
    } catch (error) {
      console.error("Error exporting template:", error);
      alert("Hubo un error al descargar la plantilla.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellText: false, cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { raw: false }) as any[];

        // Group members by group_name
        const groups = new Map<string, any>();
        
        jsonData.forEach(row => {
          const groupName = row.group_name || row.Grupo || row.groupName || 'Sin Grupo';
          
          if (!groups.has(groupName)) {
            groups.set(groupName, {
              groupName,
              category: parseGuestCategoryInput(row.category || row.Categoría || 'Familia de Camilo'),
              certainty: parseCertaintyInput(row.certainty || row.Certeza || 'Seguro'),
              status: parseStatusInput(row.status || row.Estado || 'Pendiente'),
              confirmation: parseConfirmationInput(row.confirmation || row.Confirmación || row.Confirmacion || 'no'),
              rsvpStatus: 'pendiente',
              rsvpClosed: false,
              members: []
            });
          }
          
          const group = groups.get(groupName);
          group.members.push({
            id: Math.random().toString(36).substr(2, 9),
            name: row.member_name || row.Nombre || 'Invitado',
            ageCategory: parseAgeCategoryInput(row.age_category || row.Edad || 'adulto'),
            isUnknown: false
          });
        });

        // Add all groups sequentially to avoid overwhelming the database
        for (const group of Array.from(groups.values())) {
          group.maxGuests = group.members.length;
          group.rsvpCode = '';
          await onAddGuest(group);
        }

        alert(`Se importaron ${groups.size} grupos de invitados exitosamente.`);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Hubo un error al procesar el archivo. Asegúrate de usar la plantilla correcta.");
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportToExcel = () => {
    if (guests.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    try {
      const exportData = guests.flatMap(guest => 
        guest.members.map(member => {
          const assignedTable = tables.find(t => (t.assignedGuestIds || []).includes(member.id));
          return {
            'Grupo': guest.groupName || '',
            'Categoría': getGuestCategoryLabel(guest.category) || '',
            'Certeza': getCertaintyLabel(guest.certainty) || '',
            'Estado': getStatusLabel(guest.status) || '',
            'Confirmación': getConfirmationLabel(guest.confirmation) || '',
            'Código RSVP': guest.rsvpCode || '',
            'Estado RSVP': getRsvpStatusLabel(guest.rsvpStatus) || '',
            'Cupos Máximos': guest.maxGuests || 0,
            'Nombre': member.name || '',
            'Email': member.email || '',
            'Asiste': member.attending === true ? 'Sí' : member.attending === false ? 'No' : '',
            'Edad': getAgeCategoryLabel(member.ageCategory) || '',
            'Asignación': assignedTable ? assignedTable.name : '',
            'Restricciones Alimenticias': member.dietaryRestrictions || '',
            'Notas RSVP': member.rsvpNotes || '',
            'Fecha RSVP': guest.rsvpSubmittedAt ? new Date(guest.rsvpSubmittedAt).toLocaleDateString() : '',
            'Grupo Cerrado': guest.rsvpClosed ? 'Sí' : 'No'
          };
        })
      );

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Confirmaciones');
      
      XLSX.writeFile(workbook, 'rsvp-invitados.xlsx');
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Hubo un error al exportar los datos.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 serif">Invitados</h2>
          <p className="text-stone-400 text-xs mt-1">Supervisa y organiza el corazón de tu celebración</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" />
          
          <div className="relative w-full sm:w-auto">
            <button 
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="w-full sm:w-auto bg-white border border-stone-200 text-stone-500 px-4 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-stone-50 shadow-sm transition-all uppercase tracking-widest"
            >
              Acciones <ChevronDown size={14} className={`transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isActionsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsActionsOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-100 rounded-xl shadow-lg z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => { downloadTemplate(); setIsActionsOpen(false); }}
                    className="w-full text-left px-4 py-3 text-[10px] font-bold text-stone-600 hover:bg-stone-50 flex items-center gap-2 uppercase tracking-widest border-b border-stone-50"
                  >
                    <Download size={14} /> Descargar Plantilla
                  </button>
                  <button 
                    onClick={() => { fileInputRef.current?.click(); setIsActionsOpen(false); }}
                    className="w-full text-left px-4 py-3 text-[10px] font-bold text-stone-600 hover:bg-stone-50 flex items-center gap-2 uppercase tracking-widest border-b border-stone-50"
                  >
                    {ICONS.Upload} Importar CSV
                  </button>
                  <button 
                    onClick={() => { exportToExcel(); setIsActionsOpen(false); }}
                    className="w-full text-left px-4 py-3 text-[10px] font-bold text-stone-600 hover:bg-stone-50 flex items-center gap-2 uppercase tracking-widest"
                  >
                    <ArrowUpRight size={14} /> Exportar
                  </button>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={openAddModal}
            className="w-full sm:w-auto bg-[#0F1A2E] text-white px-4 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest"
          >
            {ICONS.Plus} Nuevo Registro
          </button>
        </div>
      </div>

      {/* Stats Summary - Dashboard Consistent Style */}
      <div className="bg-stone-100 rounded-2xl border border-stone-100 shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-5 gap-px">
        <SummaryCard label="Total Invitados" value={totalPersonas} icon={<Users2 size={14} />} color="bg-stone-50" />
        <SummaryCard label="Confirmadas" value={confirmadasPersonas} icon={<ICONS.Check.type {...ICONS.Check.props} size={14} />} color="bg-emerald-50" badgeColor="text-emerald-600" />
        <SummaryCard label="Sin Mesa" value={miembrosSinMesaCount} icon={<LayoutPanelTop size={14} />} color="bg-amber-50" badgeColor="text-amber-600" alert={miembrosSinMesaCount > 0} />
        <SummaryCard label="Seguras" value={segurasPersonas} icon={<ArrowUpRight size={14} />} color="bg-blue-50" badgeColor="text-blue-600" />
        <SummaryCard label="En duda" value={totalPersonas - segurasPersonas} icon={<Filter size={14} />} color="bg-rose-50" badgeColor="text-rose-600" />
      </div>

      {/* Toolbar - Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-stone-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <input 
            type="text" 
            placeholder="Buscar por grupo o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] focus:bg-white text-xs text-stone-800 transition-all font-medium"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
        </div>

        <div className="relative w-full sm:w-auto">
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest border ${activeFiltersCount > 0 ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}
          >
            <Filter size={14} /> Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-[#C6A75E] text-white text-[8px] px-1.5 py-0.5 rounded-full leading-none">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFiltersOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsFiltersOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white border border-stone-100 rounded-xl shadow-xl z-20 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Categoría</label>
                    <select 
                      value={filter} 
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-bold text-stone-600 outline-none focus:border-[#C6A75E] transition-all"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Asignación</label>
                    <select 
                      value={filterAsignacion} 
                      onChange={(e) => setFilterAsignacion(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-bold text-stone-600 outline-none focus:border-[#C6A75E] transition-all"
                    >
                      {asignacionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Certeza</label>
                    <select 
                      value={filterCerteza} 
                      onChange={(e) => setFilterCerteza(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-bold text-stone-600 outline-none focus:border-[#C6A75E] transition-all"
                    >
                      {certezaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Estado invitación</label>
                    <select 
                      value={filterEstado} 
                      onChange={(e) => setFilterEstado(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-bold text-stone-600 outline-none focus:border-[#C6A75E] transition-all"
                    >
                      {estadoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">RSVP</label>
                    <select 
                      value={filterRsvp} 
                      onChange={(e) => setFilterRsvp(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-bold text-stone-600 outline-none focus:border-[#C6A75E] transition-all"
                    >
                      {rsvpOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  {activeFiltersCount > 0 && (
                    <button 
                      onClick={() => {
                        setFilter('Todos');
                        setFilterAsignacion('Todos');
                        setFilterCerteza('Todos');
                        setFilterEstado('Todos');
                        setFilterRsvp('Todos');
                        setIsFiltersOpen(false);
                      }}
                      className="w-full pt-2 text-[9px] font-bold text-stone-400 hover:text-stone-800 uppercase tracking-widest transition-colors text-center"
                    >
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-stone-50/50 border-b border-stone-100">
              <tr className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">
                <th className="px-4 py-2.5 w-[30%]">Invitados</th>
                <th className="px-4 py-2.5 w-[12%]">Categoría</th>
                <th className="px-4 py-2.5 w-[12%]">Asignación</th>
                <th className="px-4 py-2.5 w-[10%]">Certeza</th>
                <th className="px-4 py-2.5 w-[10%]">Estado</th>
                <th className="px-4 py-2.5 w-[10%]">Confirmación</th>
                <th className="px-4 py-2.5 w-[10%] text-center">RSVP</th>
                <th className="px-4 py-2.5 w-[6%] text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {paginatedGuests.map((inv) => {
                const assignedTables = getAssignedTableNames(inv.members);
                return (
                  <tr key={inv.id} className="hover:bg-stone-50/40 transition-colors group">
                    <td className="px-4 py-4">
                      {inv.groupName && (
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">{inv.groupName}</p>
                      )}
                      <p className="font-bold text-stone-800 text-sm md:text-base serif leading-snug">
                        {inv.members.map(m => m.name).join(' & ')}
                      </p>
                      {/* 
                      <div className="flex flex-wrap gap-1 mt-2">
                        {inv.members.map((m, i) => (
                          <span key={m.id || i} className={`text-[8px] px-1.5 py-0.5 rounded-md border font-bold uppercase tracking-tighter ${m.isUnknown ? 'border-stone-100 text-stone-300 italic' : 'border-stone-100 bg-stone-50 text-stone-500'}`}>
                            {getAgeCategoryLabel(m.ageCategory)}
                          </span>
                        ))}
                      </div> */}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative group/cat">
                        <select 
                          value={parseGuestCategoryInput(inv.category)} 
                          onChange={(e) => onUpdateGuest(inv.id, { category: e.target.value })}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          title="Cambiar categoría"
                        >
                          {GUEST_CATEGORIES.map(cat => (
                            <option key={parseGuestCategoryInput(cat)} value={parseGuestCategoryInput(cat)}>{cat}</option>
                          ))}
                        </select>
                        <div className="text-[9px] font-bold uppercase text-stone-500 bg-stone-50 border border-stone-100 rounded-xl px-2 py-1.5 group-hover/cat:bg-white group-hover/cat:border-[#C6A75E] transition-all flex items-center justify-between gap-1">
                          <span className="leading-tight whitespace-pre-line">
                            {getGuestCategoryLabel(inv.category).replace(/ (de Camilo|de Valentina|ambos)$/, '\n$1')}
                          </span>
                          <ChevronDown size={10} className="opacity-50 shrink-0" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                       <select 
                          value={parseCertaintyInput(inv.certainty)} 
                          onChange={(e) => onUpdateGuest(inv.id, { certainty: e.target.value })}
                          className={`text-[9px] font-bold uppercase rounded-xl px-2 py-1.5 outline-none border transition-all ${parseCertaintyInput(inv.certainty) === 'seguro' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : parseCertaintyInput(inv.certainty) === 'tal_vez' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                        >
                          <option value="seguro">Seguro</option>
                          <option value="tal_vez">Tal vez</option>
                          <option value="pendiente">Pendiente</option>
                        </select>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={parseStatusInput(inv.status)} 
                        onChange={(e) => onUpdateGuest(inv.id, { status: e.target.value })}
                        className="text-[9px] font-bold uppercase text-stone-500 bg-stone-50 border border-stone-100 rounded-xl px-2 py-1.5 focus:border-[#C6A75E] outline-none"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="enviada">Enviada</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={parseConfirmationInput(inv.confirmation)} 
                        onChange={(e) => onUpdateGuest(inv.id, { confirmation: e.target.value })}
                        className={`text-[9px] font-bold uppercase rounded-xl px-2 py-1.5 outline-none border transition-all ${parseConfirmationInput(inv.confirmation) === 'si' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                      >
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select 
                        value={parseRsvpStatusInput(inv.rsvpStatus)} 
                        onChange={(e) => onUpdateGuest(inv.id, { rsvpStatus: e.target.value })}
                        className={`text-[9px] font-bold uppercase rounded-xl px-3 py-1.5 outline-none border transition-all cursor-pointer ${
                          parseRsvpStatusInput(inv.rsvpStatus) === 'confirmado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 
                          parseRsvpStatusInput(inv.rsvpStatus) === 'parcial' ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm' :
                          parseRsvpStatusInput(inv.rsvpStatus) === 'rechazado' ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm' :
                          parseRsvpStatusInput(inv.rsvpStatus) === 'cerrado' ? 'bg-stone-200 text-stone-600 border-stone-300 shadow-sm' :
                          'bg-stone-50 text-stone-400 border-stone-100'
                        }`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="parcial">Parcial</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button onClick={() => openEditModal(inv)} className="p-2 text-blue-700 hover:text-white hover:bg-blue-600 rounded-lg shadow-sm transition-all bg-blue-100 border border-blue-200" title="Editar">
                          <ICONS.Edit.type {...ICONS.Edit.props} size={16} />
                        </button>
                        <button onClick={() => onRemoveGuest(inv.id)} className="p-2 text-rose-700 hover:text-white hover:bg-rose-600 rounded-lg shadow-sm transition-all bg-rose-100 border border-rose-200" title="Eliminar">
                          <ICONS.Trash.type {...ICONS.Trash.props} size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredGuests.length === 0 && (
                 <tr>
                   <td colSpan={7} className="px-4 py-10 text-center">
                      <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mx-auto mb-3">
                        <Users2 size={24} />
                      </div>
                      <p className="text-stone-400 text-xs italic serif">No se encontraron invitados que coincidan con los criterios.</p>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredGuests.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-stone-100 bg-stone-50/30">
            <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              <span>Mostrar</span>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-stone-200 rounded-lg outline-none focus:border-[#C6A75E] transition-all"
              >
                {[10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>por página</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-white hover:text-stone-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-white hover:text-stone-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Popup - Consistent with Luxury UI */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingGuestId ? 'Editar Registro' : 'Añadir Registro'}
        subtitle="Gestión de Invitación"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editingGuestId && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Tipo de Entrada</label>
              <div className="flex flex-col sm:flex-row gap-2">
                {(['Solo', 'Pareja', 'Grupo Familiar'] as GuestEntryType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setEntryType(type);
                      if (type === 'Solo') setMembers([members[0]]);
                      else if (type === 'Pareja' && members.length < 2) setMembers([members[0], { name: '', ageCategory: 'adulto', isUnknown: false }]);
                    }}
                    className={`flex-1 flex flex-row sm:flex-col items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 text-[10px] font-bold transition-all uppercase tracking-tighter ${entryType === type ? 'bg-[#0F1A2E] text-white border-transparent shadow-md' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}
                  >
                    {type === 'Solo' ? <UserPlus size={16} /> : <Users2 size={16} />}
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Nombre del Grupo</label>
              <input 
                type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Ej: Familia Rivera..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] focus:bg-white text-xs text-stone-900 font-semibold shadow-inner transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Categoría</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] focus:bg-white text-xs text-stone-900 font-bold transition-all"
              >
                {GUEST_CATEGORIES.map(cat => (
                  <option key={parseGuestCategoryInput(cat)} value={parseGuestCategoryInput(cat)}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Integrantes del grupo</label>
              {(entryType === 'Grupo Familiar' || editingGuestId) && (
                <button 
                  type="button" onClick={handleAddMemberField}
                  className="text-[9px] font-bold text-[#C6A75E] uppercase flex items-center gap-1 hover:text-[#0F1A2E] transition-colors"
                >
                  <Plus size={10} /> Añadir integrante
                </button>
              )}
            </div>

            {members.map((m, idx) => (
              <div key={m.id || idx} className="p-4 bg-stone-50 border border-stone-100 rounded-2xl space-y-4 shadow-inner group">
                <div className="flex items-center justify-between">
                  <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Invitado {idx + 1}</h4>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" checked={m.isUnknown} onChange={e => updateMember(idx, { isUnknown: e.target.checked })}
                        className="w-3.5 h-3.5 rounded accent-[#0F1A2E]"
                      />
                      <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">Desconocido</span>
                    </label>
                    {members.length > 1 && (
                      <button 
                        type="button" onClick={() => setMembers(members.filter((_, i) => i !== idx))}
                        className="text-stone-300 hover:text-rose-500 transition-colors"
                      >
                        <ICONS.Trash.type {...ICONS.Trash.props} size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1 mb-1 block">Nombre</label>
                    <input 
                      type="text" value={m.name} disabled={m.isUnknown}
                      onChange={e => updateMember(idx, { name: e.target.value })}
                      placeholder={m.isUnknown ? "Invitado por confirmar" : "Nombre completo"}
                      className="w-full px-4 py-2.5 bg-white border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-xs text-stone-800 placeholder-stone-400 disabled:bg-stone-100 disabled:text-stone-300 font-semibold"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1 mb-1 block">Edad</label>
                    <select 
                      value={parseAgeCategoryInput(m.ageCategory || 'adulto')} onChange={e => updateMember(idx, { ageCategory: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-xs text-stone-800 font-bold"
                    >
                      <option value="adulto">Adulto</option>
                      <option value="nino">Niño</option>
                      <option value="bebe">Bebé</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1 mb-1 block">Asiste</label>
                    <select 
                      value={m.attending === true ? "true" : m.attending === false ? "false" : ""} 
                      onChange={e => {
                        const val = e.target.value;
                        updateMember(idx, { attending: val === "true" ? true : val === "false" ? false : null });
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-xs text-stone-800 font-bold"
                    >
                      <option value="">Seleccionar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 md:gap-4 pt-6 border-t border-stone-50">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Certeza</label>
              <select 
                value={parseCertaintyInput(certainty)} onChange={e => setCertainty(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-[9px] font-bold uppercase text-stone-800 outline-none focus:border-[#C6A75E] focus:bg-white"
              >
                <option value="seguro">Seguro</option>
                <option value="tal_vez">Tal vez</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Invitación</label>
              <select 
                value={parseStatusInput(status)} onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-[9px] font-bold uppercase text-stone-800 outline-none focus:border-[#C6A75E] focus:bg-white"
              >
                <option value="pendiente">Pendiente</option>
                <option value="enviada">Enviada</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Confirmación</label>
              <select 
                value={parseConfirmationInput(confirmation)} onChange={e => setConfirmation(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-[9px] font-bold uppercase text-stone-800 outline-none focus:border-[#C6A75E] focus:bg-white"
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">RSVP</label>
              <select 
                value={parseRsvpStatusInput(rsvpStatus)} onChange={e => setRsvpStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-[9px] font-bold uppercase text-stone-800 outline-none focus:border-[#C6A75E] focus:bg-white"
              >
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Parcial</option>
                <option value="confirmado">Confirmado</option>
                <option value="rechazado">Rechazado</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button 
              type="button" onClick={() => setIsModalOpen(false)}
              className="w-full sm:flex-1 py-3 border-2 border-stone-100 rounded-xl text-stone-400 font-bold text-xs hover:bg-stone-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="w-full sm:flex-[2] py-3 text-white font-bold rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-[10px]"
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
  <div className="bg-white p-4 flex flex-col h-full relative group transition-colors hover:bg-stone-50/50">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${color} text-stone-500`}>
          {icon}
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
      </div>
      {alert && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
    </div>
    <div className="mt-auto">
      <h4 className={`text-2xl font-bold serif leading-tight ${badgeColor || 'text-stone-800'}`}>{value}</h4>
    </div>
  </div>
);
