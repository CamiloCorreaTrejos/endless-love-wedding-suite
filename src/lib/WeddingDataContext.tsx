
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WeddingData, Guest, Table, BudgetItem, Task, Vendor, UserProfile } from '../../types';
import { 
  getGuestsByWedding, 
  getTablesByWedding, 
  getVendorsByWedding, 
  getBudgetByWedding, 
  getTasksByWedding,
  getWeddingById,
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

export const WeddingDataProvider: React.FC<{ children: React.ReactNode, weddingId: string | null, profileLoading?: boolean }> = ({ children, weddingId, profileLoading }) => {
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
    if (!id || id === '00000000-0000-0000-0000-000000000000') {
      console.warn("MODULE_BLOCKED_NO_WEDDING_ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    console.log("WEDDING_DATA_REFRESH_START", { weddingId: id });
    try {
      const [weddingRes, guestsRes, tablesRes, vendorsRes, budgetRes, tasksRes] = await Promise.all([
        getWeddingById(id),
        getGuestsByWedding(id),
        getTablesByWedding(id),
        getVendorsByWedding(id),
        getBudgetByWedding(id),
        getTasksByWedding(id)
      ]);

      const wedding = weddingRes.data;

      setWeddingData(prev => ({
        ...prev,
        partner1: wedding?.partner1_name || prev.partner1,
        partner2: wedding?.partner2_name || prev.partner2,
        date: wedding?.wedding_date || prev.date,
        budget: wedding?.total_budget || prev.budget,
        coverImageUrl: wedding?.cover_image_url || null,
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
    if (weddingId && !profileLoading) {
      refetchAll(weddingId);
    }
  }, [weddingId, refetchAll, profileLoading]);

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
