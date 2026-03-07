
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { GuestList } from './components/GuestList';
import { BudgetTracker } from './components/BudgetTracker';
import { TaskList } from './components/TaskList';
import { SeatingPlanner } from './components/SeatingPlanner';
import { VendorManager } from './components/VendorManager';
import { RsvpManager } from './components/RsvpManager';
import { PublicRsvp } from './components/PublicRsvp';
import { NotificationsPage } from './components/NotificationsPage';
import { ToastContainer } from './components/ToastContainer';
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
  assignGuestMemberToTable,
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
import { NotificationsProvider, useNotifications } from './src/contexts/NotificationsContext';

const AppContent: React.FC = () => {
  const { authUser, session, userProfile, loading: authLoading, authError, profileLoading, profileWarning, signOut, retryBootstrap, retryProfile } = useAuth();
  const { weddingData, loading: dataLoading, error: dataError, refetchAll, setWeddingData } = useWeddingData();
  const { refetch: refetchNotifs } = useNotifications();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [actionError, setActionError] = useState<string | null>(null);

  const weddingId = userProfile?.wedding_id;

  // --- RSVP Route Detection ---
  const path = window.location.pathname;
  const isRsvpRoute = path.startsWith('/rsvp/');
  const rsvpCode = isRsvpRoute ? path.split('/rsvp/')[1] : null;

  if (isRsvpRoute && rsvpCode) {
    return <PublicRsvp code={rsvpCode} />;
  }

  // --- Notifications Polling ---
  useEffect(() => {
    if (weddingId && !profileLoading) {
      refetchNotifs(weddingId, userProfile?.id);
      const interval = setInterval(() => {
        refetchNotifs(weddingId, userProfile?.id);
      }, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [weddingId, userProfile?.id, refetchNotifs, profileLoading]);

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
      console.log("UPDATE_GUEST_START", { id, updates });
      const { error } = await updateGuest(id, updates as any, weddingId);
      if (error) throw error;
      console.log("UPDATE_GUEST_OK", { id });
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

  const handleAddTable = async (table: Omit<Table, 'id'>) => {
    if (!weddingId) return;
    try {
      const { error } = await createTable(table, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("CREATE_TABLE_ERROR", error);
      setActionError("No se pudo crear la mesa.");
    }
  };

  const handleUpdateTable = async (id: string, updates: Partial<Table>) => {
    if (!weddingId) return;
    try {
      const { error } = await updateTable(id, updates, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("UPDATE_TABLE_ERROR", error);
    }
  };

  const handleRemoveTable = async (id: string) => {
    if (!weddingId) return;
    try {
      const { error } = await deleteTable(id, weddingId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("DELETE_TABLE_ERROR", error);
    }
  };

  const handleAssignGuestToTable = async (memberId: string, tableId: string | null) => {
    if (!weddingId) return;
    try {
      const { error } = await assignGuestMemberToTable(memberId, tableId);
      if (error) throw error;
      await refetchAll(weddingId);
    } catch (error) {
      console.error("ASSIGN_GUEST_TO_TABLE_ERROR", error);
      setActionError("No se pudo asignar el invitado.");
    }
  };

  const handleUpdateTables = async (tables: Table[]) => {
    if (!weddingId) return;
    try {
      // This is used for bulk updates like dragging or reordering if needed
      // But we should prefer single updates for better performance and reliability
      for (const table of tables) {
        await updateTable(table.id, table, weddingId);
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

  // --- Notifications Route Detection ---
  const isNotifRoute = path === '/notificaciones';
  
  const renderContent = () => {
    if (isNotifRoute) return <NotificationsPage />;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={weddingData} />;
      case 'guests': return <GuestList guests={weddingData.guests} tables={weddingData.tables} onAddGuest={handleAddGuest} onRemoveGuest={handleRemoveGuest} onUpdateGuest={handleUpdateGuest} />;
      case 'seating': return <SeatingPlanner tables={weddingData.tables} guests={weddingData.guests} onUpdateTable={handleUpdateTable} onAddTable={handleAddTable} onRemoveTable={handleRemoveTable} onAssignGuest={handleAssignGuestToTable} />;
      case 'rsvp': return weddingId ? <RsvpManager weddingId={weddingId} /> : null;
      case 'vendors': return <VendorManager vendors={weddingData.vendors} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} onRemoveVendor={handleRemoveVendor} />;
      case 'budget': return <BudgetTracker expenses={weddingData.expenses} totalBudget={weddingData.budget} onAddExpense={handleAddExpense} onUpdateBudget={handleUpdateBudget} onRemoveExpense={handleRemoveExpense} />;
      case 'tasks': return <TaskList tasks={weddingData.tasks} onToggleTask={handleToggleTask} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onRemoveTask={handleRemoveTask} />;
      default: return <Dashboard data={weddingData} />;
    }
  };

  const isConfigMissing = !userProfile?.wedding_id || userProfile.wedding_id === 'placeholder';

  if (authLoading) return <ElegantLoader />;

  if (authError && (!session || (!userProfile && !profileLoading))) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-[#0F1A2E] serif mb-2">Error de Sesión</h2>
        <p className="text-stone-500 text-sm max-w-md mb-8">{authError}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={retryBootstrap} className="w-full py-3 bg-[#0F1A2E] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all">
            Reintentar
          </button>
          <button onClick={signOut} className="w-full py-3 border border-stone-200 text-stone-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-all">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (!authUser) return <Login />;

  if (!userProfile && profileLoading) {
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

  if (isConfigMissing) {
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
      <ToastContainer />
      {profileWarning && (
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mb-6 flex items-center justify-between gap-3 text-amber-700 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span>{profileWarning}</span>
          </div>
          <button onClick={retryProfile} className="underline decoration-amber-200 hover:decoration-amber-400">Reintentar</button>
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
      <NotificationsProvider>
        <AuthContextConsumer />
      </NotificationsProvider>
    </AuthProvider>
  );
};

const AuthContextConsumer: React.FC = () => {
  const { userProfile, profileLoading } = useAuth();
  return (
    <WeddingDataProvider weddingId={userProfile?.wedding_id || null} profileLoading={profileLoading}>
      <AppContent />
    </WeddingDataProvider>
  );
};

export default App;
