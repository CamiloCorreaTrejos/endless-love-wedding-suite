
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WeddingData, Guest, Table, BudgetItem, Task, Vendor, UserProfile } from '../../types';
import { 
  getGuestsByWedding, 
  getTablesByWedding, 
  getVendorsByWedding, 
  getBudgetByWedding, 
  getTasksByWedding,
  supabase
} from '../../services/supabase';

interface WeddingDataContextType {
  weddingData: WeddingData;
  loading: boolean;
  error: string | null;
  refetchAll: (weddingId: string) => Promise<void>;
  setWeddingData: React.Dispatch<React.SetStateAction<WeddingData>>;
}

const WeddingDataContext = createContext<WeddingDataContextType | undefined>(undefined);

export const WeddingDataProvider: React.FC<{ children: React.ReactNode, weddingId: string | null }> = ({ children, weddingId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weddingData, setWeddingData] = useState<WeddingData>({
    partner1: 'Camilo',
    partner2: 'Valentina',
    date: '2027-08-21',
    budget: 35000,
    guests: [],
    expenses: [],
    tasks: [],
    tables: [],
    vendors: []
  });

  const refetchAll = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    console.log("WEDDING_DATA_REFRESH_START", { weddingId: id });
    try {
      const [guestsRes, tablesRes, vendorsRes, budgetRes, tasksRes] = await Promise.all([
        getGuestsByWedding(id),
        getTablesByWedding(id),
        getVendorsByWedding(id),
        getBudgetByWedding(id),
        getTasksByWedding(id)
      ]);

      setWeddingData(prev => ({
        ...prev,
        guests: guestsRes.data || [],
        tables: tablesRes.data || [],
        vendors: vendorsRes.data || [],
        expenses: budgetRes.data || [],
        tasks: tasksRes.data || []
      }));
      console.log("WEDDING_DATA_REFRESH_OK");
    } catch (err) {
      console.error("WEDDING_DATA_REFRESH_ERROR", err);
      setError("Error al refrescar los datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (weddingId) {
      refetchAll(weddingId);
    }
  }, [weddingId, refetchAll]);

  return (
    <WeddingDataContext.Provider value={{ weddingData, loading, error, refetchAll, setWeddingData }}>
      {children}
    </WeddingDataContext.Provider>
  );
};

export const useWeddingData = () => {
  const context = useContext(WeddingDataContext);
  if (!context) throw new Error('useWeddingData debe usarse dentro de WeddingDataProvider');
  return context;
};
