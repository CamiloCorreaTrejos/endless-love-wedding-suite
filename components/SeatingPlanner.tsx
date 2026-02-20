
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ICONS, COLORS } from '../constants';
import { Table, Guest, GuestMember } from '../types';
import { 
  Search, RotateCcw, Maximize2, Trash2, Layers, ZoomIn, ZoomOut, 
  Maximize, UserCheck, UserMinus, Plus, MoveHorizontal, MoveVertical,
  Copy, MousePointer2, Hand, Info, AlertTriangle, CheckCircle2,
  Users, X, User, LayoutPanelTop
} from 'lucide-react';

interface SeatingPlannerProps {
  tables: Table[];
  guests: Guest[];
  onUpdateTables: (tables: Table[]) => void;
}

const SNAP_SIZE = 10;
const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;

export const SeatingPlanner: React.FC<SeatingPlannerProps> = ({ tables, guests, onUpdateTables }) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeSeatIndex, setActiveSeatIndex] = useState<{ tableId: string, seatIndex: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [guestSearch, setGuestSearch] = useState('');
  const [zoom, setZoom] = useState(0.8);
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Strategic Metrics
  const metrics = useMemo(() => {
    const totalTables = tables.filter(t => !['stage', 'dancefloor', 'cake'].includes(t.type)).length;
    const totalCapacity = tables.reduce((acc, t) => acc + (['stage', 'dancefloor', 'cake'].includes(t.type) ? 0 : t.seats), 0);
    const allGuestMembers = guests.flatMap(g => g.members);
    const assignedIds = new Set(tables.flatMap(t => t.assignedGuestIds).filter(id => id && id !== ''));
    const assignedCount = assignedIds.size;
    const unassignedCount = allGuestMembers.length - assignedCount;

    return { totalTables, totalCapacity, assignedCount, unassignedCount, allGuestMembers };
  }, [tables, guests]);

  const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);

  const availableMembers = useMemo(() => 
    metrics.allGuestMembers.filter(m => 
      !tables.some(t => t.assignedGuestIds.includes(m.id)) &&
      m.name.toLowerCase().includes(guestSearch.toLowerCase())
    ), [metrics.allGuestMembers, tables, guestSearch]);

  const handleMouseDownTable = (e: React.MouseEvent, tableId: string) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    setSelectedTableId(tableId);
    setDraggedTableId(tableId);
    setIsDragging(true);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    });
  };

  const handleMouseDownBoard = (e: React.MouseEvent) => {
    if (tool === 'pan') {
      setIsDragging(true);
      setDragOffset({ x: e.clientX, y: e.clientY });
      return;
    }
    setSelectedTableId(null);
    setActiveSeatIndex(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    if (tool === 'pan') {
      if (containerRef.current) {
        const dx = e.clientX - dragOffset.x;
        const dy = e.clientY - dragOffset.y;
        containerRef.current.scrollLeft -= dx;
        containerRef.current.scrollTop -= dy;
        setDragOffset({ x: e.clientX, y: e.clientY });
      }
      return;
    }

    if (draggedTableId && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      let x = (e.clientX - containerRect.left + containerRef.current.scrollLeft) / zoom - dragOffset.x;
      let y = (e.clientY - containerRect.top + containerRef.current.scrollTop) / zoom - dragOffset.y;
      
      // Snap to grid
      x = Math.round(x / SNAP_SIZE) * SNAP_SIZE;
      y = Math.round(y / SNAP_SIZE) * SNAP_SIZE;
      
      onUpdateTables(tables.map(t => t.id === draggedTableId ? { ...t, x, y } : t));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedTableId(null);
  };

  const addElement = (type: Table['type']) => {
    const isObject = ['cake', 'stage', 'dancefloor'].includes(type);
    const baseSize = isObject ? (type === 'cake' ? 80 : 200) : 140;
    const seatsCount = isObject ? 0 : 8;
    
    const newTable: Table = {
      id: Math.random().toString(36).substr(2, 9),
      name: isObject ? (type === 'cake' ? 'Pastel' : type === 'stage' ? 'Tarima' : 'Pista') : `Mesa ${tables.filter(t => !['cake', 'stage', 'dancefloor'].includes(t.type)).length + 1}`,
      type,
      seats: seatsCount,
      x: 200 + (containerRef.current?.scrollLeft || 0) / zoom,
      y: 200 + (containerRef.current?.scrollTop || 0) / zoom,
      width: type === 'serpentine' ? 280 : baseSize,
      height: type === 'serpentine' ? 160 : baseSize,
      rotation: 0,
      assignedGuestIds: Array(seatsCount).fill('')
    };
    onUpdateTables([...tables, newTable]);
    setSelectedTableId(newTable.id);
  };

  const duplicateTable = () => {
    if (!selectedTable) return;
    const newTable: Table = {
      ...selectedTable,
      id: Math.random().toString(36).substr(2, 9),
      x: selectedTable.x + 40,
      y: selectedTable.y + 40,
      name: `${selectedTable.name} (Copia)`
    };
    onUpdateTables([...tables, newTable]);
    setSelectedTableId(newTable.id);
  };

  const updateSelectedTable = (updates: Partial<Table>) => {
    if (!selectedTableId) return;
    onUpdateTables(tables.map(t => t.id === selectedTableId ? { ...t, ...updates } : t));
  };

  const assignMemberToSeat = (tableId: string, seatIndex: number, memberId: string) => {
    onUpdateTables(tables.map(t => {
      if (t.id === tableId) {
        const newIds = [...t.assignedGuestIds];
        while (newIds.length < t.seats) newIds.push('');
        newIds[seatIndex] = memberId;
        return { ...t, assignedGuestIds: newIds };
      }
      return t;
    }));
    setActiveSeatIndex(null);
  };

  const unassignFromSeat = (tableId: string, seatIndex: number) => {
    onUpdateTables(tables.map(t => {
      if (t.id === tableId) {
        const newIds = [...t.assignedGuestIds];
        newIds[seatIndex] = '';
        return { ...t, assignedGuestIds: newIds };
      }
      return t;
    }));
  };

  const renderChairs = (table: Table) => {
    if (['cake', 'stage', 'dancefloor'].includes(table.type)) return null;
    
    const chairs = [];
    const count = table.seats;
    for (let i = 0; i < count; i++) {
      let cx = 50, cy = 50;
      if (table.type === 'round') {
        const angle = (i / count) * 2 * Math.PI;
        cx = 50 + 56 * Math.cos(angle);
        cy = 50 + 56 * Math.sin(angle);
      } else if (table.type === 'square') {
        const perSide = Math.ceil(count / 4);
        const side = Math.floor(i / perSide);
        const pos = ((i % perSide) + 0.5) / perSide;
        if (side === 0) { cx = 10 + 80 * pos; cy = -15; }
        else if (side === 1) { cx = 115; cy = 10 + 80 * pos; }
        else if (side === 2) { cx = 90 - 80 * pos; cy = 115; }
        else if (side === 3) { cx = -15; cy = 90 - 80 * pos; }
      } else if (table.type === 'serpentine') {
        const t = i / (count - 1);
        const px = (1 - t) * 20 + t * 180;
        const py = 50 + 45 * Math.sin(t * Math.PI * 2);
        cx = (px / 200) * 100;
        cy = py;
      }

      const assignedGuestId = table.assignedGuestIds[i];
      const member = assignedGuestId ? metrics.allGuestMembers.find(m => m.id === assignedGuestId) : null;
      const isBeingEdited = activeSeatIndex?.tableId === table.id && activeSeatIndex?.seatIndex === i;

      chairs.push(
        <div 
          key={i} 
          onClick={(e) => { 
            e.stopPropagation(); 
            setActiveSeatIndex({ tableId: table.id, seatIndex: i }); 
            setSelectedTableId(table.id); 
            setGuestSearch('');
          }}
          className={`absolute w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center text-[9px] font-bold ${
            assignedGuestId ? 'bg-[#0F1A2E] border-white text-white shadow-lg' : 'bg-white border-stone-200 hover:border-[#C6A75E] hover:scale-110'
          } ${isBeingEdited ? 'ring-[6px] ring-[#C6A75E]/40 scale-125 z-50' : ''}`}
          style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)', zIndex: isBeingEdited ? 50 : 10 }}
        >
          {assignedGuestId ? <User size={10} /> : i + 1}
          {assignedGuestId && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-stone-900 text-white rounded-lg opacity-0 group-hover/table:opacity-100 whitespace-nowrap pointer-events-none text-[10px] shadow-xl font-bold transition-opacity">
              {member?.name}
            </div>
          )}
        </div>
      );
    }
    return chairs;
  };

  const getTableStatusColor = (table: Table) => {
    if (['stage', 'dancefloor', 'cake'].includes(table.type)) return '';
    const occupied = table.assignedGuestIds.filter(id => id && id !== '').length;
    if (occupied > table.seats) return 'border-rose-500 bg-rose-50/20';
    if (occupied === table.seats) return 'border-emerald-500 bg-emerald-50/20';
    if (occupied > 0) return 'border-amber-400 bg-amber-50/20';
    return 'border-stone-200 bg-white';
  };

  return (
    <div className="flex flex-col h-full space-y-12 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Header Editorial - Unified with rest of modules */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-4xl font-bold text-stone-800 serif">Plano de Mesas</h2>
          <p className="text-stone-400 text-sm mt-1">Diseña la atmósfera y distribución estratégica del salón</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 bg-white border border-stone-200 p-1 rounded-xl shadow-sm">
             <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={<MousePointer2 size={16} />} label="Editor" />
             <ToolBtn active={tool === 'pan'} onClick={() => setTool('pan')} icon={<Hand size={16} />} label="Mover" />
           </div>
        </div>
      </div>

      {/* Strategic Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 px-1">
        <MetricBox label="Mesas Totales" value={metrics.totalTables} icon={<Layers size={18} />} color="bg-stone-50" />
        <MetricBox label="Capacidad" value={metrics.totalCapacity} icon={<Users size={18} />} color="bg-stone-50" />
        <MetricBox label="Asignados" value={metrics.assignedCount} icon={<CheckCircle2 size={18} />} color="bg-emerald-50" textColor="text-emerald-700" />
        <MetricBox label="Sin Mesa" value={metrics.unassignedCount} icon={<AlertTriangle size={18} />} color="bg-amber-50" textColor="text-amber-700" alert={metrics.unassignedCount > 0} />
      </div>

      {/* Main Workspace - Adjusted Proportions 75/25 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-[600px] relative px-1">
        
        {/* Editor Toolbar & Canvas (75% Width) */}
        <div className="flex-[3] flex flex-col gap-4 min-h-0 bg-white rounded-[3rem] border border-stone-100 shadow-sm overflow-hidden p-4">
          
          {/* Top Tools Selector - More Compact */}
          <div className="flex items-center justify-between px-2 pb-3 border-b border-stone-50 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              <ShapeBtn onClick={() => addElement('round')} label="Redonda" icon={<div className="w-4 h-4 rounded-full border-2 border-stone-400" />} />
              <ShapeBtn onClick={() => addElement('square')} label="Cuadrada" icon={<div className="w-4 h-4 rounded-md border-2 border-stone-400" />} />
              <ShapeBtn onClick={() => addElement('serpentine')} label="S-Mesa" icon={<div className="w-5 h-3 border-2 border-stone-400 rounded-full" style={{ borderRadius: '8px 0 8px 0' }} />} />
              <div className="w-px h-8 bg-stone-100 mx-1" />
              <ShapeBtn onClick={() => addElement('cake')} label="Pastel" icon={<div className="w-3.5 h-3.5 bg-amber-700 rounded-full shadow-sm" />} />
              <ShapeBtn onClick={() => addElement('dancefloor')} label="Pista" icon={<div className="w-5 h-5 bg-amber-50 border-2 border-amber-200 rounded-md" />} />
              <ShapeBtn onClick={() => addElement('stage')} label="Tarima" icon={<div className="w-6 h-3 bg-stone-800 rounded" />} />
            </div>

            <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-100 ml-3">
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 hover:bg-white rounded-lg text-stone-400 transition-all hover:text-stone-800"><ZoomOut size={14} /></button>
              <span className="text-[10px] font-bold text-stone-800 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-white rounded-lg text-stone-400 transition-all hover:text-stone-800"><ZoomIn size={14} /></button>
              <button onClick={() => setZoom(0.8)} className="p-2 hover:bg-white rounded-lg text-stone-400 transition-all hover:text-stone-800"><Maximize size={14} /></button>
            </div>
          </div>

          {/* Canvas Area - Protagonist Height */}
          <div 
            ref={containerRef}
            className={`flex-1 overflow-auto relative rounded-[2.5rem] bg-stone-50/50 cursor-${tool === 'pan' ? 'grab' : 'default'} custom-scrollbar scroll-smooth shadow-inner`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={handleMouseDownBoard}
          >
            <div 
              ref={boardRef}
              className="relative transition-transform duration-75 origin-top-left"
              style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT, 
                transform: `scale(${zoom})`,
                backgroundImage: `radial-gradient(circle, #dee0e3 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            >
              {tables.map(table => {
                const isSelected = selectedTableId === table.id;
                const statusColor = getTableStatusColor(table);
                const isObject = ['cake', 'stage', 'dancefloor'].includes(table.type);

                return (
                  <div
                    key={table.id}
                    onMouseDown={(e) => handleMouseDownTable(e, table.id)}
                    className={`absolute cursor-move select-none group/table ${isSelected ? 'z-40' : 'z-10'}`}
                    style={{ 
                      left: table.x, 
                      top: table.y, 
                      width: table.width, 
                      height: table.height, 
                      transform: `rotate(${table.rotation}deg)` 
                    }}
                  >
                    <div 
                      className={`relative w-full h-full flex flex-col items-center justify-center transition-all border-2 ${statusColor} ${
                        table.type === 'round' || table.type === 'cake' ? 'rounded-full' : (table.type === 'stage' ? 'rounded-md' : 'rounded-2xl')
                      } ${isSelected ? 'ring-4 ring-[#C6A75E]/40 border-[#C6A75E] shadow-2xl scale-[1.02]' : 'shadow-md border-transparent'}`}
                      style={{ 
                        backgroundColor: table.type === 'stage' ? '#1c1917' : (table.type === 'cake' ? '#b45309' : (table.type === 'dancefloor' ? '#fffbeb' : '#ffffff')),
                        borderStyle: table.type === 'serpentine' ? 'none' : 'solid'
                      }}
                    >
                      {table.type === 'serpentine' && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 200 100" preserveAspectRatio="none">
                          <path 
                            d="M 20 50 C 40 100, 80 100, 100 50 S 160 0, 180 50" 
                            fill="none" 
                            stroke={isSelected ? '#C6A75E' : '#e5e7eb'} 
                            strokeWidth="50" 
                            strokeLinecap="round" 
                            className="transition-all" 
                          />
                          <path 
                            d="M 20 50 C 40 100, 80 100, 100 50 S 160 0, 180 50" 
                            fill="none" 
                            stroke="white" 
                            strokeWidth="44" 
                            strokeLinecap="round" 
                            className="transition-all" 
                          />
                        </svg>
                      )}

                      <div className="z-20 text-center flex flex-col items-center justify-center" style={{ transform: `rotate(${-table.rotation}deg)` }}>
                        <span className={`text-[11px] font-bold uppercase tracking-widest leading-none ${table.type === 'stage' || table.type === 'cake' ? 'text-white' : 'text-stone-800'}`}>
                          {table.name}
                        </span>
                        {!isObject && (
                          <span className={`text-[9px] font-bold mt-1.5 px-2 py-0.5 rounded-full ${table.type === 'cake' ? 'text-white/60 bg-white/10' : 'text-[#C6A75E] bg-[#C6A75E]/5'}`}>
                            {table.assignedGuestIds.filter(id => id && id !== '').length} / {table.seats}
                          </span>
                        )}
                      </div>

                      {renderChairs(table)}

                      {/* Controls Layer */}
                      {isSelected && (
                        <>
                          <div 
                            className="absolute -top-7 left-1/2 -translate-x-1/2 p-2 bg-[#0F1A2E] text-white rounded-full shadow-2xl cursor-ew-resize z-50 hover:scale-110 transition-transform border-2 border-white"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const onMove = (me: MouseEvent) => {
                                const delta = (me.clientX - startX) / zoom;
                                updateSelectedTable({ rotation: (table.rotation + delta) % 360 });
                              };
                              const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                              window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                            }}
                          >
                            <RotateCcw size={14} />
                          </div>
                          
                          <div 
                            className="absolute -bottom-2.5 -right-2.5 p-1.5 bg-white border border-stone-200 rounded-lg shadow-2xl cursor-nwse-resize z-50 hover:bg-stone-50 transition-colors"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const sx = e.clientX; const sy = e.clientY; const sw = table.width; const sh = table.height;
                              const onMove = (me: MouseEvent) => {
                                const dw = (me.clientX - sx) / zoom; const dh = (me.clientY - sy) / zoom;
                                updateSelectedTable({ width: Math.max(80, sw + dw), height: Math.max(80, sh + dh) });
                              };
                              const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                              window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                            }}
                          >
                            <Maximize2 size={14} className="text-[#C6A75E]" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Sidebar (25% Width - More Narrow) */}
        <aside className="flex-1 flex flex-col shrink-0 min-h-0 space-y-4 max-w-sm lg:max-w-xs">
          {selectedTable ? (
            <div className="flex-1 bg-white rounded-[2.5rem] border border-stone-100 shadow-xl p-8 flex flex-col min-h-0 animate-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-50 shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-stone-900 serif">Propiedades</h3>
                  <p className="text-[9px] text-[#C6A75E] font-bold uppercase tracking-widest mt-1">
                    {selectedTable.type}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={duplicateTable} title="Duplicar" className="p-2 text-stone-400 hover:text-[#0F1A2E] hover:bg-stone-50 rounded-xl transition-all shadow-sm">
                    <Copy size={16} />
                  </button>
                  <button onClick={() => { onUpdateTables(tables.filter(t => t.id !== selectedTableId)); setSelectedTableId(null); }} title="Eliminar" className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-8">
                <section className="space-y-5">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Etiqueta</label>
                     <input 
                       type="text" value={selectedTable.name} 
                       onChange={e => updateSelectedTable({ name: e.target.value })} 
                       className="w-full px-5 py-3 bg-stone-50 border border-stone-100 rounded-xl outline-none text-xs font-bold text-stone-800 focus:bg-white focus:border-[#C6A75E] transition-all shadow-inner" 
                     />
                   </div>

                   {!['stage', 'dancefloor', 'cake'].includes(selectedTable.type) && (
                     <div className="space-y-2">
                        <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Capacidad ({selectedTable.seats})</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { const n = Math.max(1, selectedTable.seats - 1); updateSelectedTable({ seats: n, assignedGuestIds: selectedTable.assignedGuestIds.slice(0, n) }); }}
                            className="flex-1 py-3 bg-stone-50 border border-stone-100 rounded-xl text-stone-800 font-bold hover:bg-stone-100 transition-all shadow-sm text-sm"
                          >-</button>
                          <button 
                            onClick={() => { const n = selectedTable.seats + 1; updateSelectedTable({ seats: n, assignedGuestIds: [...selectedTable.assignedGuestIds, ''] }); }}
                            className="flex-1 py-3 bg-stone-50 border border-stone-100 rounded-xl text-stone-800 font-bold hover:bg-stone-100 transition-all shadow-sm text-sm"
                          >+</button>
                        </div>
                     </div>
                   )}
                </section>

                {!['stage', 'dancefloor', 'cake'].includes(selectedTable.type) && (
                  <section className="space-y-6 pt-8 border-t border-stone-50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">Estado</h4>
                      <span className="text-[10px] font-bold text-[#C6A75E]">{selectedTable.assignedGuestIds.filter(id => id && id !== '').length} / {selectedTable.seats}</span>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest ml-1">Asientos</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {selectedTable.assignedGuestIds.map((mid, idx) => {
                          const m = metrics.allGuestMembers.find(gm => gm.id === mid);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => {
                                setActiveSeatIndex({ tableId: selectedTable.id, seatIndex: idx });
                                setGuestSearch('');
                              }}
                              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                                mid ? 'bg-stone-50 border-stone-100' : 'bg-white border-dashed border-stone-200 hover:border-[#C6A75E] hover:bg-stone-50'
                              } ${activeSeatIndex?.seatIndex === idx ? 'ring-2 ring-[#C6A75E] border-transparent' : ''}`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                 <span className="text-[9px] font-bold text-stone-400 w-4">S{idx + 1}</span>
                                 <span className={`text-[11px] font-bold truncate ${mid ? 'text-stone-800' : 'text-stone-300 italic'}`}>
                                   {m ? m.name : 'Vacio'}
                                 </span>
                              </div>
                              {mid && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); unassignFromSeat(selectedTable.id, idx); }} 
                                  className="text-stone-300 hover:text-rose-500 transition-colors shrink-0"
                                >
                                  <UserMinus size={12} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-[#F5F1E9] rounded-[2.5rem] border border-stone-200 shadow-inner p-8 flex flex-col items-center justify-center text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#C6A75E] shadow-xl border border-stone-100 animate-pulse">
                <LayoutPanelTop size={36} />
              </div>
              <div className="space-y-3">
                <h4 className="text-xl font-bold text-stone-800 serif">Plano Inteligente</h4>
                <p className="text-xs text-stone-500 leading-relaxed px-4 font-medium">
                  Organiza el espacio arrastrando elementos y asigna invitados de forma visual.
                </p>
              </div>
              <div className="space-y-3 w-full">
                 <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-stone-100 text-left shadow-sm">
                    <p className="text-[9px] font-bold text-[#C6A75E] uppercase mb-1">Editor</p>
                    <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">Arrastra mesas desde la barra superior para empezar.</p>
                 </div>
                 <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-stone-100 text-left shadow-sm">
                    <p className="text-[9px] font-bold text-[#C6A75E] uppercase mb-1">Asignar</p>
                    <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">Toca un número de asiento para añadir invitados.</p>
                 </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Quick Seat Assignment Modal */}
      {activeSeatIndex && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-bold text-stone-900 serif">Asignar Invitado</h3>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">
                      Mesa: {selectedTable?.name} · Asiento {activeSeatIndex.seatIndex + 1}
                    </p>
                 </div>
                 <button onClick={() => setActiveSeatIndex(null)} className="p-2.5 bg-white hover:bg-stone-100 text-stone-400 rounded-xl shadow-sm transition-all">
                    <X size={18} />
                 </button>
              </div>

              <div className="p-8 space-y-5">
                 <div className="relative">
                    <input 
                      type="text" value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Buscar por nombre..."
                      autoFocus
                      className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#C6A75E] focus:bg-white text-sm font-semibold text-stone-800 transition-all shadow-inner"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                 </div>

                 <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                    {availableMembers.length > 0 ? (
                      availableMembers.map(m => (
                        <button 
                          key={m.id} 
                          onClick={() => assignMemberToSeat(activeSeatIndex.tableId, activeSeatIndex.seatIndex, m.id)}
                          className="w-full flex items-center justify-between p-4 bg-white hover:bg-[#0F1A2E] hover:text-white border border-stone-100 rounded-2xl group transition-all shadow-sm hover:shadow-xl active:scale-95"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-white/10 group-hover:text-white transition-colors">
                                 <User size={14} />
                              </div>
                              <div className="text-left">
                                 <p className="text-xs font-bold">{m.name}</p>
                                 <p className="text-[9px] font-bold uppercase tracking-tighter opacity-50 group-hover:opacity-100">{m.ageCategory}</p>
                              </div>
                           </div>
                           <Plus size={16} className="text-[#C6A75E] opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))
                    ) : (
                      <div className="py-10 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                         <Search size={24} className="mx-auto text-stone-200 mb-2" />
                         <p className="text-[10px] text-stone-400 italic serif">No hay invitados disponibles.</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-6 bg-stone-50/50 border-t border-stone-100 text-center">
                 <button 
                  onClick={() => setActiveSeatIndex(null)}
                  className="text-stone-400 font-bold text-[10px] uppercase tracking-widest hover:text-stone-800 transition-colors"
                 >
                   Cerrar ventana
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Global Style Inject for Scrollbars */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e1e3e8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #C6A75E;
        }
      ` }} />
    </div>
  );
};

// Internal Subcomponents
const MetricBox = ({ label, value, icon, color, textColor, alert = false }: any) => (
  <div className={`p-5 rounded-[2rem] border border-stone-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${color}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${alert ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-stone-400'}`}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] uppercase font-bold text-stone-400 tracking-widest mb-0.5">{label}</p>
      <h4 className={`text-xl font-bold serif ${textColor || 'text-stone-800'}`}>{value}</h4>
    </div>
  </div>
);

const ToolBtn = ({ active, icon, onClick, label }: any) => (
  <button 
    onClick={onClick} 
    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${active ? 'bg-[#0F1A2E] text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-800'}`}
  >
    {icon}
    <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'block' : 'hidden'}`}>{label}</span>
  </button>
);

const ShapeBtn = ({ icon, onClick, label }: any) => (
  <button 
    onClick={onClick} 
    className="flex flex-col items-center gap-1.5 p-2 hover:bg-stone-50 rounded-2xl transition-all shrink-0 min-w-[70px] group"
  >
    <div className="p-2.5 bg-white border border-stone-100 rounded-xl shadow-sm group-hover:scale-110 group-hover:border-[#C6A75E] transition-all group-active:scale-95">
      {icon}
    </div>
    <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-800 transition-colors whitespace-nowrap">{label}</span>
  </button>
);
