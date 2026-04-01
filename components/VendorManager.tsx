
import React, { useState, useMemo } from 'react';
import { ICONS, COLORS, VENDOR_CATEGORIES } from '../constants';
import { Vendor } from '../types';
import { Modal } from './Modal';
/* Added missing icon imports from lucide-react */
import { LayoutGrid, List, Plus, Search, Filter, AlertCircle, Phone, Mail, FileText, CheckCircle2, Briefcase, Edit2, X, DollarSign, Trash2 } from 'lucide-react';

interface VendorManagerProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onUpdateVendor: (id: string, updates: Partial<Vendor>) => void;
  onRemoveVendor: (id: string) => void;
}

export const VendorManager: React.FC<VendorManagerProps> = ({ vendors, onAddVendor, onUpdateVendor, onRemoveVendor }) => {
  const [viewType, setViewType] = useState<'grid' | 'table'>('table');
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
    notes: '',
    pdfUrl: '',
    pdfName: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      notes: '',
      pdfUrl: '',
      pdfName: ''
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setFormData({ ...vendor });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendorData = { ...formData };
    if (editingVendorId) {
      onUpdateVendor(editingVendorId, { ...vendorData, pdfFile: selectedFile } as any);
    } else {
      onAddVendor({ ...vendorData, pdfFile: selectedFile } as any);
    }
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFormData({
        ...formData,
        pdfName: file.name
      });
    }
  };

  const removePdf = () => {
    setSelectedFile(null);
    setFormData({
      ...formData,
      pdfUrl: '',
      pdfName: ''
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-800 serif">Proveedores</h2>
          <p className="text-stone-400 text-sm mt-1">Gestiona y supervisa todos los servicios contratados para tu gran día</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto bg-[#0F1A2E] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={16} /> Añadir proveedor
        </button>
      </div>

      {/* Summary Metrics Unified */}
      <div className="bg-stone-100 rounded-2xl border border-stone-100 shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-4 gap-px">
        {[
          { label: 'Total', value: totalVendors, icon: Briefcase, color: 'text-stone-500', bg: 'bg-stone-50' },
          { label: 'Contratados', value: contractedVendors, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pendientes', value: pendingVendors, icon: Filter, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Pagos', value: `$${pendingPayments.toLocaleString()}`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4 flex flex-col h-full relative group transition-colors hover:bg-stone-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${m.bg} ${m.color}`}>
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

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white p-3 md:p-4 rounded-2xl border border-stone-100 shadow-sm">
        <div className="relative w-full lg:w-96">
          <input 
            type="text" 
            placeholder="Buscar por nombre o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-[#C6A75E] focus:bg-white text-sm text-stone-800 transition-all font-medium"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 lg:flex-none px-3 md:px-4 py-2 md:py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold text-stone-600 outline-none focus:border-[#C6A75E] transition-all min-w-[140px]"
          >
            <option value="Todos">Todas las categorías</option>
            {VENDOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 lg:flex-none px-3 md:px-4 py-2 md:py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold text-stone-600 outline-none focus:border-[#C6A75E] transition-all min-w-[140px]"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Cotización">Cotización</option>
            <option value="Contratado">Contratado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <div className="h-6 w-px bg-stone-100 mx-1 hidden lg:block" />

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewType('grid')}
              className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white text-[#0F1A2E] shadow-sm' : 'text-stone-400'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewType('table')}
              className={`p-2 rounded-lg transition-all ${viewType === 'table' ? 'bg-white text-[#0F1A2E] shadow-sm' : 'text-stone-400'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredVendors.map(vendor => (
            <VendorCard key={vendor.id} vendor={vendor} onEdit={openEditModal} />
          ))}
          {filteredVendors.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mx-auto mb-3">
                <Briefcase size={28} />
              </div>
              <p className="text-stone-400 text-sm font-medium italic">No se encontraron proveedores que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">
                  <th className="px-5 py-3">Proveedor</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Presupuesto</th>
                  <th className="px-5 py-3">Saldo</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-stone-800 text-sm">{vendor.name}</p>
                      <p className="text-[10px] text-stone-400">{vendor.contactName}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-stone-500">{vendor.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-stone-800">${vendor.totalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-rose-500">${(vendor.totalAmount - vendor.paidAmount).toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={vendor.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(vendor)} className="p-2 text-blue-700 hover:text-white hover:bg-blue-600 rounded-lg shadow-sm transition-all bg-blue-100 border border-blue-200" title="Editar">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal / Popup Detail */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingVendorId ? 'Detalle del Proveedor' : 'Nuevo Proveedor'}
        subtitle="Gestión de Servicios"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* Carga de PDF */}
          <div className="space-y-3 p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
            <div className="flex items-center gap-2 mb-1">
               <FileText size={16} className="text-[#C6A75E]" />
               <h4 className="text-xs font-bold text-stone-800 uppercase tracking-widest">Documentos y Contratos (PDF)</h4>
            </div>
            
            {!formData.pdfUrl && !selectedFile ? (
              <div className="relative group">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full py-8 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-[#C6A75E] group-hover:bg-white transition-all">
                  <Plus size={24} className="text-stone-300 group-hover:text-[#C6A75E]" />
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Haga clic o arrastre para cargar PDF</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-stone-800 truncate">{formData.pdfName || 'Documento cargado'}</p>
                    <p className="text-[9px] text-stone-400 uppercase font-bold">Archivo PDF</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={removePdf}
                  className="p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            )}
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
      </Modal>
    </div>
  );
};

// Subcomponentes
const MetricCard = ({ label, value, icon, color, badgeColor }: { label: string, value: any, icon: any, color: string, badgeColor?: string }) => (
  <div className={`p-4 sm:p-5 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between ${color}`}>
    <div>
      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">{label}</p>
      <h4 className={`text-xl font-bold ${badgeColor || 'text-stone-800'}`}>{value}</h4>
    </div>
    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
      {icon}
    </div>
  </div>
);

const VendorCard: React.FC<{ vendor: Vendor, onEdit: (v: Vendor) => void }> = ({ vendor, onEdit }) => {
  const balance = vendor.totalAmount - vendor.paidAmount;
  const progress = (vendor.paidAmount / vendor.totalAmount) * 100 || 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full border-t-4" style={{ borderTopColor: vendor.status === 'Contratado' ? '#10b981' : (vendor.status === 'Cotización' ? '#f59e0b' : '#e5e7eb') }}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C6A75E] bg-[#C6A75E]/5 px-2.5 py-1 rounded-full mb-2 inline-block">
            {vendor.category}
          </span>
          <h3 className="text-lg font-bold text-stone-800 leading-tight group-hover:text-[#C6A75E] transition-colors">{vendor.name}</h3>
        </div>
        <button onClick={() => onEdit(vendor)} className="p-2 text-blue-700 hover:text-white hover:bg-blue-600 rounded-lg shadow-sm transition-all bg-blue-100 border border-blue-200" title="Editar">
          <Edit2 size={14} />
        </button>
      </div>

      <div className="space-y-3 flex-1">
        {vendor.contactName && (
          <div className="flex items-center gap-2.5 text-xs text-stone-500 font-medium">
            <div className="w-6 h-6 rounded-md bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
               <Briefcase size={12} />
            </div>
            <span className="truncate">{vendor.contactName}</span>
          </div>
        )}
        {vendor.phone && (
          <div className="flex items-center gap-2.5 text-xs text-stone-500 font-medium">
            <div className="w-6 h-6 rounded-md bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
               <Phone size={12} />
            </div>
            <span className="truncate">{vendor.phone}</span>
          </div>
        )}
        {vendor.email && (
          <div className="flex items-center gap-2.5 text-xs text-stone-500 font-medium">
            <div className="w-6 h-6 rounded-md bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
               <Mail size={12} />
            </div>
            <span className="truncate">{vendor.email}</span>
          </div>
        )}
        
        <div className="pt-3 border-t border-stone-50">
           <div className="flex justify-between text-[10px] font-bold uppercase text-stone-400 mb-1.5">
              <span>Progreso de Pago</span>
              <span className={balance > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                {Math.round(progress)}%
              </span>
           </div>
           <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                style={{ width: `${progress}%` }} 
              />
           </div>
           <div className="flex justify-between mt-2">
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

      <div className="mt-5 flex items-center justify-between pt-4 border-t border-stone-50">
        <div className="flex items-center gap-2">
          <StatusBadge status={vendor.status} />
          {vendor.pdfUrl && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open(vendor.pdfUrl, '_blank', 'noopener,noreferrer');
              }}
              className="px-2 py-1 bg-rose-50 text-rose-500 rounded-md hover:bg-rose-100 transition-all flex items-center gap-1 border border-rose-100/50"
              title={vendor.pdfName || 'Ver Contrato'}
            >
              <FileText size={10} />
              <span className="text-[8px] font-bold uppercase tracking-tighter">
                PDF • {vendor.pdfName ? (vendor.pdfName.length > 12 ? vendor.pdfName.substring(0, 9) + '...' : vendor.pdfName) : 'Contrato'}
              </span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {vendor.contractSigned ? (
            <div className="flex items-center gap-1 text-emerald-600 text-[9px] font-bold uppercase">
              <FileText size={12} /> Contrato OK
            </div>
          ) : (
             <div className="flex items-center gap-1 text-rose-400 text-[9px] font-bold uppercase">
              <AlertCircle size={12} /> Sin firma
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
    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
};
