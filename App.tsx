
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { GuestList } from './components/GuestList';
import { BudgetTracker } from './components/BudgetTracker';
import { TaskList } from './components/TaskList';
import { SeatingPlanner } from './components/SeatingPlanner';
import { VendorManager } from './components/VendorManager';
import { Login } from './components/Login';
import { ElegantLoader } from './components/ElegantLoader';
import { AlertCircle } from 'lucide-react';
import { Guest, Table, BudgetItem, Task, Vendor } from './types';
import { 
  createGuest, 
  updateGuest, 
  deleteGuest,
  createTable,
  updateTable,
  deleteTable,
  createVendor,
  updateVendor,
  deleteVendor,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  createTask,
  updateTask,
  deleteTask,
  updateWedding
} from './services/supabase';
import { AuthProvider, useAuth } from './src/lib/AuthContext';
import { WeddingDataProvider, useWeddingData } from './src/lib/WeddingDataContext';

const AppContent: React.FC = () => {
  const { authUser, userProfile, loading: authLoading, signOut } = useAuth();
  const { weddingData, loading: dataLoading, error: dataError, refetchAll, setWeddingData } = useWeddingData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [actionError, setActionError] = useState<string | null>(null);

  const weddingId = userProfile?.wedding_id;

  // --- Handlers de Datos con Supabase ---
  const handleAddGuest = async (guest: Omit<Guest, 'id'>) => {
    if (!weddingId) return;
    setActionError(null);
    console.log("CREATE_GUEST_START", { weddingId, payload: guest });
    try {
      const { error } = await createGuest(guest, weddingId);
      if (error) throw error;
      console.log("CREATE_GUEST_OK");
      await refetchAll(weddingId);
    } catch (error) {
      console.error("CREATE_GUEST_ERROR", error);
      setActionError("No se pudo guardar el invitado.");
    }
  };

  const handleRemoveGuest = async (id: string) => {
    if (!weddingId) return;
    setActionError(null);
    try {
      const { error } = await deleteGuest(id, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("DELETE_GUEST_ERROR", error);
      setActionError("No se pudo eliminar el invitado.");
    }
  };

  const handleUpdateGuest = async (id: string, updates: Partial<Guest>) => {
    if (!weddingId) return;
    setActionError(null);
    try {
      const { error } = await updateGuest(id, updates as any, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("UPDATE_GUEST_ERROR", error);
      setActionError("No se pudo actualizar el invitado.");
    }
  };

  const handleToggleTask = async (id: string) => {
    if (!weddingId) return;
    const task = weddingData.tasks.find(t => t.id === id);
    if (task) {
      try {
        const { error } = await updateTask(id, { completed: !task.completed }, weddingId);
        if (error) throw error;
        await refetchAll(weddingId);
      } catch (error) {
        console.error("TOGGLE_TASK_ERROR", error);
      }
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'completed'>) => {
    if (!weddingId) return;
    setActionError(null);
    try {
      const { error } = await createTask({ ...task, completed: false }, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("CREATE_TASK_ERROR", error);
      setActionError("No se pudo guardar la tarea.");
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    if (!weddingId) return;
    try {
      const { error } = await updateTask(id, updates, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("UPDATE_TASK_ERROR", error);
    }
  };

  const handleRemoveTask = async (id: string) => {
    if (!weddingId) return;
    try {
      const { error } = await deleteTask(id, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("DELETE_TASK_ERROR", error);
    }
  };

  const handleUpdateTables = async (tables: Table[]) => {
    if (!weddingId) return;
    try {
      for (const table of tables) {
        const { error } = await updateTable(table.id, table, weddingId);
        if (error) throw error;
      }
      await refetchAll(weddingId);
    } catch (error) {
      console.error("UPDATE_TABLES_ERROR", error);
    }
  };

  const handleAddExpense = async (item: Omit<BudgetItem, 'id'>) => {
    if (!weddingId) return;
    setActionError(null);
    try {
      const { error } = await createBudgetItem(item, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("CREATE_EXPENSE_ERROR", error);
      setActionError("No se pudo guardar el gasto.");
    }
  };

  const handleRemoveExpense = async (id: string) => {
    if (!weddingId) return;
    try {
      const { error } = await deleteBudgetItem(id, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("DELETE_EXPENSE_ERROR", error);
    }
  };

  const handleUpdateBudget = async (value: number) => {
    if (!weddingId) return;
    try {
      const { error } = await updateWedding(weddingId, { total_budget: value });
      if (error) throw error;
      setWeddingData(prev => ({ ...prev, budget: value }));
    } catch (error) {
      console.error("UPDATE_BUDGET_ERROR", error);
    }
  };

  const handleAddVendor = async (vendor: Omit<Vendor, 'id'> & { pdfFile?: File }) => {
    if (!weddingId) return;
    setActionError(null);
    try {
      const { error } = await createVendor(vendor, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("CREATE_VENDOR_ERROR", error);
      setActionError("No se pudo guardar el proveedor.");
    }
  };

  const handleUpdateVendor = async (id: string, updates: Partial<Vendor> & { pdfFile?: File }) => {
    if (!weddingId) return;
    try {
      const { error } = await updateVendor(id, updates, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("UPDATE_VENDOR_ERROR", error);
    }
  };

  const handleRemoveVendor = async (id: string) => {
    if (!weddingId) return;
    try {
      const { error } = await deleteVendor(id, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("DELETE_VENDOR_ERROR", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={weddingData} />;
      case 'guests': return <GuestList guests={weddingData.guests} tables={weddingData.tables} onAddGuest={handleAddGuest} onRemoveGuest={handleRemoveGuest} onUpdateGuest={handleUpdateGuest} />;
      case 'seating': return <SeatingPlanner tables={weddingData.tables} guests={weddingData.guests} onUpdateTables={handleUpdateTables} />;
      case 'vendors': return <VendorManager vendors={weddingData.vendors} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} onRemoveVendor={handleRemoveVendor} />;
      case 'budget': return <BudgetTracker expenses={weddingData.expenses} totalBudget={weddingData.budget} onAddExpense={handleAddExpense} onUpdateBudget={handleUpdateBudget} onRemoveExpense={handleRemoveExpense} />;
      case 'tasks': return <TaskList tasks={weddingData.tasks} onToggleTask={handleToggleTask} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onRemoveTask={handleRemoveTask} />;
      default: return <Dashboard data={weddingData} />;
    }
  };

  const isResilientMode = userProfile?.wedding_id === '00000000-0000-0000-0000-000000000000';
  const isConfigMissing = !userProfile?.wedding_id || userProfile.wedding_id === 'placeholder';

  if (authLoading) return <ElegantLoader />;
  if (!authUser) return <Login />;

  if (!userProfile) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 text-center">
        <ElegantLoader />
        <p className="mt-4 text-stone-400 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
          Sincronizando perfil...
        </p>
        <div className="mt-12 pt-8 border-t border-stone-50">
          <p className="text-[10px] text-stone-300 uppercase tracking-widest mb-4">¿Problemas de conexión?</p>
          <button 
            onClick={signOut}
            className="px-6 py-2 border border-stone-200 rounded-full text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:bg-stone-50 transition-all"
          >
            Cerrar Sesión y Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (isConfigMissing && !isResilientMode) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-[#0F1A2E] serif mb-2">Configuración Requerida</h2>
        <p className="text-stone-500 text-sm max-w-md mb-8">
          No se ha detectado una base de datos configurada o tu perfil está incompleto.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-[#0F1A2E] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all">
            Recargar Aplicación
          </button>
          <button onClick={signOut} className="w-full py-3 border border-stone-200 text-stone-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-all">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={signOut} data={weddingData}>
      {isResilientMode && (
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mb-6 flex items-center justify-between gap-3 text-amber-700 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span>Modo Resiliente Activo: Los cambios no se guardarán permanentemente.</span>
          </div>
          <button onClick={() => window.location.reload()} className="underline decoration-amber-200 hover:decoration-amber-400">Reintentar Conexión</button>
        </div>
      )}
      {(dataError || actionError) && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-6 flex items-center justify-center gap-3 text-rose-600 text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          {dataError || actionError}
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthContextConsumer />
    </AuthProvider>
  );
};

const AuthContextConsumer: React.FC = () => {
  const { userProfile } = useAuth();
  return (
    <WeddingDataProvider weddingId={userProfile?.wedding_id || null}>
      <AppContent />
    </WeddingDataProvider>
  );
};

export default App;
