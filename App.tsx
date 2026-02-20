
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { GuestList } from './components/GuestList';
import { BudgetTracker } from './components/BudgetTracker';
import { TaskList } from './components/TaskList';
import { SeatingPlanner } from './components/SeatingPlanner';
import { VendorManager } from './components/VendorManager';
import { Login } from './components/Login';
import { ElegantLoader } from './components/ElegantLoader';
import { WeddingData, Guest, Table, BudgetItem, Task, Vendor, UserProfile } from './types';
import { INITIAL_GUESTS, INITIAL_EXPENSES, INITIAL_TASKS, INITIAL_TABLES, INITIAL_VENDORS, COLORS } from './constants';
import { supabase } from './lib/supabaseClient';

const STORAGE_KEY = 'endless_love_wedding_data';

// --- Contexto de Autenticación ---
interface AuthContextType {
  authUser: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [weddingData, setWeddingData] = useState<WeddingData>(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try { return JSON.parse(savedData); } catch (e) { console.error("Error local storage", e); }
    }
    return {
      partner1: 'Camilo', partner2: 'Valentina', date: '2027-08-21', budget: 35000,
      guests: INITIAL_GUESTS, expenses: INITIAL_EXPENSES, tasks: INITIAL_TASKS,
      tables: INITIAL_TABLES, vendors: INITIAL_VENDORS
    };
  });

  // Persistencia local de la data de la boda (mock por ahora)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weddingData));
  }, [weddingData]);

  // --- Lógica de Perfil ---
  const fetchOrCreateProfile = async (userId: string, email: string) => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email, role: 'admin', full_name: '' })
          .select()
          .single();
        if (insertError) throw insertError;
        profile = newProfile;
      }
      setUserProfile(profile as UserProfile);
    } catch (err) {
      console.error('[Profiles Sync Error]:', err);
    }
  };

  // --- Ciclo de Vida de Autenticación ---
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setAuthUser(session.user);
        await fetchOrCreateProfile(session.user.id, session.user.email || '');
      }
      
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthUser(session.user);
          await fetchOrCreateProfile(session.user.id, session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setUserProfile(null);
          setActiveTab('dashboard');
        }
      });

      return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- Handlers de Datos (Sin cambios en lógica de negocio) ---
  const handleAddGuest = (guest: Omit<Guest, 'id'>) => {
    const newGuest = { ...guest, id: Math.random().toString(36).substr(2, 9) };
    setWeddingData(prev => ({ ...prev, guests: [...prev.guests, newGuest] }));
  };
  const handleRemoveGuest = (id: string) => {
    setWeddingData(prev => ({ ...prev, guests: prev.guests.filter(g => g.id !== id) }));
  };
  const handleUpdateGuest = (id: string, updates: Partial<Guest>) => {
    setWeddingData(prev => ({ ...prev, guests: prev.guests.map(g => g.id === id ? { ...g, ...updates } : g) }));
  };
  const handleToggleTask = (id: string) => {
    setWeddingData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  };
  const handleAddTask = (task: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = { ...task, id: Math.random().toString(36).substr(2, 9), completed: false };
    setWeddingData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };
  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setWeddingData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };
  const handleUpdateTables = (tables: Table[]) => {
    setWeddingData(prev => ({ ...prev, tables }));
  };
  const handleAddExpense = (item: Omit<BudgetItem, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setWeddingData(prev => ({ ...prev, expenses: [...prev.expenses, newItem] }));
  };
  const handleUpdateBudget = (value: number) => {
    setWeddingData(prev => ({ ...prev, budget: value }));
  };
  const handleAddVendor = (vendor: Omit<Vendor, 'id'>) => {
    const newVendor = { ...vendor, id: Math.random().toString(36).substr(2, 9) };
    setWeddingData(prev => ({ ...prev, vendors: [...prev.vendors, newVendor] }));
  };
  const handleUpdateVendor = (id: string, updates: Partial<Vendor>) => {
    setWeddingData(prev => ({ ...prev, vendors: prev.vendors.map(v => v.id === id ? { ...v, ...updates } : v) }));
  };
  const handleRemoveVendor = (id: string) => {
    setWeddingData(prev => ({ ...prev, vendors: prev.vendors.filter(v => v.id !== id) }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={weddingData} />;
      case 'guests': return <GuestList guests={weddingData.guests} tables={weddingData.tables} onAddGuest={handleAddGuest} onRemoveGuest={handleRemoveGuest} onUpdateGuest={handleUpdateGuest} />;
      case 'seating': return <SeatingPlanner tables={weddingData.tables} guests={weddingData.guests} onUpdateTables={handleUpdateTables} />;
      case 'vendors': return <VendorManager vendors={weddingData.vendors} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} onRemoveVendor={handleRemoveVendor} />;
      case 'budget': return <BudgetTracker expenses={weddingData.expenses} totalBudget={weddingData.budget} onAddExpense={handleAddExpense} onUpdateBudget={handleUpdateBudget} />;
      case 'tasks': return <TaskList tasks={weddingData.tasks} onToggleTask={handleToggleTask} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} />;
      default: return <Dashboard data={weddingData} />;
    }
  };

  if (loading) return <ElegantLoader />;

  if (!authUser) return <Login />;

  return (
    <AuthContext.Provider value={{ authUser, userProfile, loading, signOut: handleLogout }}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} data={weddingData}>
        {renderContent()}
      </Layout>
    </AuthContext.Provider>
  );
};

export default App;
