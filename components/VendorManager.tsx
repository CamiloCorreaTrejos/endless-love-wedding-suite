
import React, { useState, useMemo } from 'react';
import { ICONS, COLORS, VENDOR_CATEGORIES } from '../constants';
import { Vendor } from '../types';
/* Added missing icon imports from lucide-react */
import { LayoutGrid, List, Plus, Search, Filter, AlertCircle, Phone, Mail, FileText, CheckCircle2, Briefcase, Edit2, X, DollarSign, Trash2 } from 'lucide-react';

interface VendorManagerProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onUpdateVendor: (id: string, updates: Partial<Vendor>) => void;
  onRemoveVendor: (id: string) => void;
}

export const VendorManager: React.FC<VendorManagerProps> = ({ vendors, onAddVendor, onUpdateVendor, onRemoveVendor }) => {
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Form State
  const [formData, setFormData] = useState<Omit<Vendor, 'id'>>({
    name: '',
    category: 'Lugar',
    status: 'Pendiente',
    totalAmount: 0,
    paidAmount: 0,
    contactName: '',
    phone: '',
    email: '',
    contractSigned: false,
    dueDate: '',
    notes: ''
  });

  // Metrics
  const totalVendors = vendors.length;
  const contractedVendors = vendors.filter(v => v.status === 'Contratado').length;
  const pendingVendors = vendors.filter(v => v.status === 'Pendiente' || v.status === 'Cotización').length;
  const pendingPayments = vendors.reduce((acc, v) => acc + (v.totalAmount - v.paidAmount), 0);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || v.category === categoryFilter;
      const matchesStatus = statusFilter === 'Todos' || v.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [vendors, searchTerm, categoryFilter, statusFilter]);

  const openAddModal = () => {
    setEditingVendorId(null);
    setFormData({
      name: '',
      category: 'Lugar',
      status: 'Pendiente',
      totalAmount: 0,
      paidAmount: 0,
      contactName: '',
      phone: '',
      email: '',
      contractSigned: false,
      dueDate: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setFormData({ ...vendor });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendorId) {
      onUpdateVendor(editingVendorId, formData);
    } else {
      onAddVendor(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 serif">Proveedores</h2>
          <p className="text-stone-400 text-sm mt-1">Gestiona y supervisa todos los servicios contratados para tu gran día</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#0F1A2E] text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus size={18} /> Añadir proveedor
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Proveedores" value={totalVendors} icon={<Briefcase className="text-stone-400" />} color="bg-stone-50" />
        <MetricCard label="Contratados" value={contractedVendors} icon={<CheckCircle2 className="text-emerald-500" />} color="bg-emerald-50" badgeColor="text-emerald-600" />
        <MetricCard label="Pendientes" value={pendingVendors} icon={<Filter className="text-amber-500" />} color="bg-amber-50" badgeColor="text-amber-600" />
        <MetricCard label="Pagos Pendientes" value={`$${pendingPayments.toLocaleString()}`} icon={<AlertCircle className="text-rose-500" />} color="bg-rose-50" badgeColor="text-rose-600" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-stone-100 shadow-sm">
        <div className="relative w-full lg:w-96">
          <input 
            type="text" 
            placeholder="Buscar por nombre o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-sm text-stone-800 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold text-stone-600 outline-none focus:border-[#C6A75E] min-w-[140px]"
          >
            <option value="Todos">Todas las categorías</option>
            {VENDOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold text-stone-600 outline-none focus:border-[#C6A75E] min-w-[140px]"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Cotización">Cotización</option>
            <option value="Contratado">Contratado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <div className="h-8 w-px bg-stone-100 mx-2 hidden lg:block" />

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewType('grid')}
              className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white text-[#0F1A2E] shadow-sm' : 'text-stone-400'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewType('table')}
              className={`p-2 rounded-lg transition-all ${viewType === 'table' ? 'bg-white text-[#0F1A2E] shadow-sm' : 'text-stone-400'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVendors.map(vendor => (
            <VendorCard key={vendor.id} vendor={vendor} onEdit={openEditModal} />
          ))}
          {filteredVendors.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mx-auto mb-4">
                <Briefcase size={36} />
              </div>
              <p className="text-stone-400 text-sm font-medium italic">No se encontraron proveedores que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                <th className="px-8 py-4">Proveedor</th>
                <th className="px-8 py-4">Categoría</th>
                <th className="px-8 py-4">Presupuesto</th>
                <th className="px-8 py-4">Saldo</th>
                <th className="px-8 py-4">Estado</th>
                <th className="px-8 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredVendors.map(vendor => (
                <tr key={vendor.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-stone-800 text-sm">{vendor.name}</p>
                    <p className="text-[10px] text-stone-400">{vendor.contactName}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-semibold text-stone-500">{vendor.category}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-stone-800">${vendor.totalAmount.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-rose-500">${(vendor.totalAmount - vendor.paidAmount).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={vendor.status} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => openEditModal(vendor)} className="p-2 text-stone-300 hover:text-[#C6A75E] hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal / Popup Detail */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-stone-200">
            <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div>
                <h3 className="text-2xl font-bold text-stone-900 serif">{editingVendorId ? 'Detalle del Proveedor' : 'Nuevo Proveedor'}</h3>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1">Gestión de Servicios</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-white text-stone-300 shadow-sm transition-all hover:text-stone-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Sección General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                  <input 
                    type="text" required value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Gourmet Real"
                    className="w-full px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] text-sm text-stone-800 font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Categoría</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-5 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] text-sm text-stone-800 font-bold"
                  >
                    {VENDOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Sección Financiera */}
              <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                   <DollarSign size={16} className="text-[#C6A75E]" />
                   <h4 className="text-xs font-bold text-stone-800 uppercase tracking-widest">Información Financiera</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Presupuesto Acordado</label>
                    <input 
                      type="number" value={formData.totalAmount}
                      onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})}
                      className="w-full px-5 py-3.5 bg-white border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] text-sm text-stone-800 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Monto Pagado</label>
                    <input 
                      type="number" value={formData.paidAmount}
                      onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})}
                      className="w-full px-5 py-3.5 bg-white border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] text-sm text-stone-800 font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-bold text-stone-400 uppercase">Saldo Pendiente:</span>
                   <span className="text-lg font-bold text-rose-500">${(formData.totalAmount - formData.paidAmount).toLocaleString()}</span>
                </div>
              </div>

              {/* Contacto & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Nombre de Contacto</label>
                    <input 
                      type="text" value={formData.contactName}
                      onChange={e => setFormData({...formData, contactName: e.target.value})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Teléfono</label>
                    <input 
                      type="text" value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-xs font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email" value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Vence pago final</label>
                    <input 
                      type="date" value={formData.dueDate}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Contract */}
              <div className="flex flex-col md:flex-row gap-6 pt-4 border-t border-stone-50">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Estado de Contratación</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cotización">Cotización recibida</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                   <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 cursor-pointer select-none">
                      <input 
                        type="checkbox" checked={formData.contractSigned}
                        onChange={e => setFormData({...formData, contractSigned: e.target.checked})}
                        className="w-5 h-5 rounded-lg accent-[#0F1A2E]"
                      />
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-tighter">¿Contrato firmado?</span>
                   </label>
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Notas Internas</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] text-xs text-stone-800"
                  placeholder="Detalles sobre el servicio, cláusulas especiales..."
                />
              </div>

              {/* Footer Modal */}
              <div className="flex gap-4 pt-6 border-t border-stone-100">
                {editingVendorId && (
                  <button 
                    type="button" onClick={() => { onRemoveVendor(editingVendorId); setIsModalOpen(false); }}
                    className="p-4 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border-2 border-stone-100 rounded-2xl text-stone-400 font-bold text-sm hover:bg-stone-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] hover:brightness-110"
                  style={{ backgroundColor: COLORS.accent }}
                >
                  {editingVendorId ? 'Actualizar Información' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponentes
const MetricCard = ({ label, value, icon, color, badgeColor }: { label: string, value: any, icon: any, color: string, badgeColor?: string }) => (
  <div className={`p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between ${color}`}>
    <div>
      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">{label}</p>
      <h4 className={`text-2xl font-bold ${badgeColor || 'text-stone-800'}`}>{value}</h4>
    </div>
    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
      {icon}
    </div>
  </div>
);

const VendorCard = ({ vendor, onEdit }: { vendor: Vendor, onEdit: (v: Vendor) => void }) => {
  const balance = vendor.totalAmount - vendor.paidAmount;
  const progress = (vendor.paidAmount / vendor.totalAmount) * 100 || 0;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm hover:shadow-xl transition-all group relative flex flex-col h-full border-t-8" style={{ borderTopColor: vendor.status === 'Contratado' ? '#10b981' : (vendor.status === 'Cotización' ? '#f59e0b' : '#e5e7eb') }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C6A75E] bg-[#C6A75E]/5 px-3 py-1 rounded-full mb-2 inline-block">
            {vendor.category}
          </span>
          <h3 className="text-xl font-bold text-stone-800 leading-tight group-hover:text-[#C6A75E] transition-colors">{vendor.name}</h3>
        </div>
        <button onClick={() => onEdit(vendor)} className="p-3 text-stone-200 hover:text-stone-800 transition-colors bg-stone-50 rounded-2xl group-hover:bg-white group-hover:shadow-md">
          <Edit2 size={16} />
        </button>
      </div>

      <div className="space-y-4 flex-1">
        <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
          <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
             <Phone size={14} />
          </div>
          {vendor.phone}
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
          <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
             <Mail size={14} />
          </div>
          {vendor.email}
        </div>
        
        <div className="pt-4 border-t border-stone-50">
           <div className="flex justify-between text-[10px] font-bold uppercase text-stone-400 mb-2">
              <span>Progreso de Pago</span>
              <span className={balance > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                {Math.round(progress)}%
              </span>
           </div>
           <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                style={{ width: `${progress}%` }} 
              />
           </div>
           <div className="flex justify-between mt-3">
              <div>
                <p className="text-[9px] text-stone-400 font-bold uppercase">Pagado</p>
                <p className="text-sm font-bold text-stone-800">${vendor.paidAmount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-stone-400 font-bold uppercase">Saldo</p>
                <p className={`text-sm font-bold ${balance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>${balance.toLocaleString()}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between pt-5 border-t border-stone-50">
        <StatusBadge status={vendor.status} />
        <div className="flex items-center gap-2">
          {vendor.contractSigned ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase">
              <FileText size={14} /> Contrato OK
            </div>
          ) : (
             <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase">
              <AlertCircle size={14} /> Sin firma
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    'Contratado': 'bg-emerald-50 text-emerald-600',
    'Cotización': 'bg-amber-50 text-amber-600',
    'Pendiente': 'bg-stone-100 text-stone-500',
    'Cancelado': 'bg-rose-50 text-rose-600'
  }[status] || 'bg-stone-50 text-stone-500';

  return (
    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
};
