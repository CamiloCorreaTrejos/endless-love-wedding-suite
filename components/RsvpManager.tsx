
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Mail, 
  Users, 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  ChevronRight, 
  Download,
  AlertCircle,
  X,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  LayoutGrid,
  List
} from 'lucide-react';
import { Guest, GuestMember } from '../types';
import { getRsvpDashboardByWedding, updateGuestRsvpFields, updateGuest, ensureGuestHasRsvpCode } from '../services/supabase';

interface RsvpManagerProps {
  weddingId: string;
}

export const RsvpManager: React.FC<RsvpManagerProps> = ({ weddingId }) => {
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showClosed, setShowClosed] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const PUBLIC_RSVP_BASE_URL = "https://camiloyvalen.netlify.app";

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await getRsvpDashboardByWedding(weddingId);
    if (!error && data) {
      setGuests(data.guests);
      setMetrics(data.metrics);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (weddingId) fetchData();
  }, [weddingId]);

  const handleCopyLink = (code: string) => {
    const url = `${PUBLIC_RSVP_BASE_URL}/rsvp/${code}`;
    navigator.clipboard.writeText(url);
    // Could add a toast here
  };

  const handleExportCSV = () => {
    const headers = ['Grupo', 'Categoría', 'Estado', 'Código', 'Confirmados', 'Cupos', 'Restricciones Alimenticias'];
    const rows = guests.map(g => [
      g.groupName,
      g.category,
      g.rsvpStatus,
      g.rsvpCode,
      g.attendingCount,
      g.maxGuests,
      g.members.map((m: any) => `${m.name}: ${m.dietaryRestrictions || 'Ninguna'}`).join(' | ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `confirmaciones_boda_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         g.rsvpCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.rsvpStatus === statusFilter;
    const matchesClosed = showClosed || !g.rsvpClosed;
    return matchesSearch && matchesStatus && matchesClosed;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pendiente: 'bg-stone-100 text-stone-500',
      parcial: 'bg-amber-50 text-amber-600',
      confirmado: 'bg-emerald-50 text-emerald-600',
      rechazado: 'bg-rose-50 text-rose-600',
      cerrado: 'bg-stone-800 text-white'
    };
    return (
      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${styles[status] || styles.pendiente}`}>
        {status}
      </span>
    );
  };

  const handleUpdateRsvp = async (guestId: string, patch: any) => {
    const { error } = await updateGuestRsvpFields(guestId, weddingId, patch);
    if (!error) {
      fetchData();
      if (selectedGuest && selectedGuest.id === guestId) {
        setSelectedGuest({ ...selectedGuest, ...patch });
      }
    }
  };

  const handleUpdateGuestMembers = async (guestId: string, members: any[]) => {
    const { error } = await updateGuest(guestId, { members }, weddingId);
    if (!error) fetchData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#0F1A2E] serif mb-2">Confirmaciones</h2>
          <p className="text-stone-400 text-xs font-medium uppercase tracking-[0.2em]">Gestión inteligente de RSVP y cupos</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-2xl text-[10px] font-bold text-stone-600 uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Cupos Totales', value: metrics?.totalCupos || 0, icon: Users, color: 'text-stone-400' },
          { label: 'Confirmados', value: metrics?.totalConfirmados || 0, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pendientes', value: metrics?.pendientes || 0, icon: Mail, color: 'text-amber-500' },
          { label: 'Rechazados', value: metrics?.totalRechazados || 0, icon: X, color: 'text-rose-500' },
          { label: 'Cerrados', value: metrics?.gruposCerrados || 0, icon: Lock, color: 'text-stone-800' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-stone-50 ${m.color}`}>
                <m.icon size={16} />
              </div>
            </div>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-[#0F1A2E] serif">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por grupo o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-stone-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-[#C6A75E]/20 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-stone-50 p-1 rounded-2xl border border-stone-100 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#0F1A2E]' : 'text-stone-400 hover:text-stone-600'}`}
              title="Vista de cuadrícula"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0F1A2E]' : 'text-stone-400 hover:text-stone-600'}`}
              title="Vista de lista"
            >
              <List size={16} />
            </button>
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-stone-50 border-none rounded-2xl text-xs font-bold text-stone-600 focus:ring-2 focus:ring-[#C6A75E]/20 transition-all"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="confirmado">Confirmado</option>
            <option value="rechazado">Rechazado</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <button 
            onClick={() => setShowClosed(!showClosed)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              showClosed ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
            }`}
          >
            {showClosed ? 'Ocultar Cerrados' : 'Mostrar Cerrados'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-stone-100 rounded-3xl animate-pulse" />
            ))
          ) : filteredGuests.length > 0 ? (
            filteredGuests.map((guest) => (
              <div 
                key={guest.id} 
                className={`bg-white p-6 rounded-3xl border transition-all hover:shadow-lg group ${
                  guest.rsvpClosed ? 'border-stone-200 opacity-75' : 'border-stone-100'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0F1A2E] serif mb-1">{guest.groupName}</h3>
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{guest.category}</p>
                  </div>
                  {getStatusBadge(guest.rsvpStatus)}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest mb-1.5">
                      <span className="text-stone-400">Progreso</span>
                      <span className="text-[#C6A75E]">{guest.attendingCount} / {guest.maxGuests}</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#C6A75E] transition-all duration-1000"
                        style={{ width: `${(guest.attendingCount / guest.maxGuests) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mb-1">Código RSVP</span>
                      <code className="text-xs font-bold text-stone-600 bg-stone-50 px-2 py-1 rounded-lg">{guest.rsvpCode}</code>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCopyLink(guest.rsvpCode)}
                        className="p-2.5 bg-stone-50 text-stone-400 rounded-xl hover:bg-[#C6A75E]/10 hover:text-[#C6A75E] transition-all"
                        title="Copiar Link"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedGuest(guest);
                          setIsModalOpen(true);
                        }}
                        className="p-2.5 bg-[#0F1A2E] text-white rounded-xl hover:bg-opacity-90 transition-all"
                        title="Ver Detalle"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-stone-200" />
              </div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">No se encontraron invitaciones</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                  <th className="p-4 font-medium whitespace-nowrap">Grupo</th>
                  <th className="p-4 font-medium whitespace-nowrap">Categoría</th>
                  <th className="p-4 font-medium whitespace-nowrap">Estado</th>
                  <th className="p-4 font-medium whitespace-nowrap">Progreso</th>
                  <th className="p-4 font-medium whitespace-nowrap">Código</th>
                  <th className="p-4 font-medium whitespace-nowrap text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-stone-50">
                      <td colSpan={6} className="p-4"><div className="h-10 bg-stone-100 rounded-xl animate-pulse" /></td>
                    </tr>
                  ))
                ) : filteredGuests.length > 0 ? (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className={`border-b border-stone-50 hover:bg-stone-50/50 transition-colors ${guest.rsvpClosed ? 'opacity-75' : ''}`}>
                      <td className="p-4 font-bold text-[#0F1A2E] serif whitespace-nowrap">{guest.groupName}</td>
                      <td className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">{guest.category}</td>
                      <td className="p-4 whitespace-nowrap">{getStatusBadge(guest.rsvpStatus)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[#C6A75E] w-8">{guest.attendingCount} / {guest.maxGuests}</span>
                          <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#C6A75E]" style={{ width: `${(guest.attendingCount / guest.maxGuests) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <code className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded-lg">{guest.rsvpCode}</code>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleCopyLink(guest.rsvpCode)}
                            className="p-2 bg-white border border-stone-100 text-stone-400 rounded-lg hover:border-[#C6A75E] hover:text-[#C6A75E] transition-all shadow-sm"
                            title="Copiar Link"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedGuest(guest);
                              setIsModalOpen(true);
                            }}
                            className="p-2 bg-[#0F1A2E] text-white rounded-lg hover:bg-opacity-90 transition-all shadow-sm"
                            title="Ver Detalle"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search size={20} className="text-stone-300" />
                      </div>
                      <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">No se encontraron invitaciones</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1A2E]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-stone-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#0F1A2E] serif mb-1">{selectedGuest.groupName}</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Detalle de Invitación</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-stone-50 rounded-full transition-all"
              >
                <X size={20} className="text-stone-400" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Cupos Máximos</label>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleUpdateRsvp(selectedGuest.id, { maxGuests: Math.max(1, selectedGuest.maxGuests - 1) })}
                        className="p-2 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all"
                      >
                        <UserMinus size={14} />
                      </button>
                      <span className="text-lg font-bold text-stone-800">{selectedGuest.maxGuests}</span>
                      <button 
                        onClick={() => handleUpdateRsvp(selectedGuest.id, { maxGuests: selectedGuest.maxGuests + 1 })}
                        className="p-2 bg-stone-50 rounded-xl hover:bg-stone-100 transition-all"
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Estado RSVP</label>
                    <select 
                      value={selectedGuest.rsvpStatus}
                      onChange={(e) => handleUpdateRsvp(selectedGuest.id, { rsvpStatus: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl text-xs font-bold text-stone-600 focus:ring-2 focus:ring-[#C6A75E]/20 transition-all"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="parcial">Parcial</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="rechazado">Rechazado</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Control de Acceso</label>
                    <button 
                      onClick={() => handleUpdateRsvp(selectedGuest.id, { rsvpClosed: !selectedGuest.rsvpClosed })}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${
                        selectedGuest.rsvpClosed 
                          ? 'bg-stone-800 border-stone-800 text-white' 
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {selectedGuest.rsvpClosed ? <Lock size={16} /> : <Unlock size={16} />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {selectedGuest.rsvpClosed ? 'Confirmación Cerrada' : 'Confirmación Abierta'}
                        </span>
                      </div>
                      <div className={`w-8 h-4 rounded-full relative transition-all ${selectedGuest.rsvpClosed ? 'bg-emerald-400' : 'bg-stone-200'}`}>
                        <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${selectedGuest.rsvpClosed ? 'right-1' : 'left-1'}`} />
                      </div>
                    </button>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Link Público</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-stone-50 px-4 py-3 rounded-2xl text-[10px] text-stone-400 truncate">
                        {window.location.origin}/rsvp/{selectedGuest.rsvpCode}
                      </div>
                      <button 
                        onClick={() => handleCopyLink(selectedGuest.rsvpCode)}
                        className="p-3 bg-stone-50 text-stone-400 rounded-2xl hover:bg-[#C6A75E]/10 hover:text-[#C6A75E] transition-all"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Miembros y Respuestas</h4>
                  {selectedGuest.rsvpSubmittedAt && (
                    <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">
                      Enviado: {new Date(selectedGuest.rsvpSubmittedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedGuest.members.map((member: any, idx: number) => (
                    <div key={member.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            member.attending ? 'bg-emerald-100 text-emerald-600' : 
                            member.attending === false ? 'bg-rose-100 text-rose-600' : 
                            'bg-stone-200 text-stone-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-xs font-bold text-stone-800">{member.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                            member.attending ? 'bg-emerald-500 text-white' : 
                            member.attending === false ? 'bg-rose-500 text-white' : 
                            'bg-stone-300 text-white'
                          }`}>
                            {member.attending ? 'Asiste' : member.attending === false ? 'No Asiste' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                      {member.dietaryRestrictions && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-white rounded-xl border border-stone-100">
                          <AlertCircle size={12} className="text-amber-500 mt-0.5" />
                          <p className="text-[10px] text-stone-500 italic">{member.dietaryRestrictions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {selectedGuest.members.length < selectedGuest.maxGuests && (
                    <button 
                      onClick={() => {
                        const newMember = { name: 'Nuevo Invitado', ageCategory: 'Adulto', attending: null };
                        handleUpdateGuestMembers(selectedGuest.id, [...selectedGuest.members, newMember]);
                      }}
                      className="w-full py-4 border-2 border-dashed border-stone-100 rounded-2xl text-[10px] font-bold text-stone-300 uppercase tracking-widest hover:border-[#C6A75E] hover:text-[#C6A75E] transition-all"
                    >
                      + Agregar Miembro
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3 bg-[#0F1A2E] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg shadow-[#0F1A2E]/20"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
