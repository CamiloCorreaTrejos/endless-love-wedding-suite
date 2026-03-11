
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(true);
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

  const weddingDataRef = useRef<WeddingData>(weddingData);
  useEffect(() => {
    weddingDataRef.current = weddingData;
  }, [weddingData]);

  const refetchAll = useCallback(async (id: string) => {
    if (!id || id === '00000000-0000-0000-0000-000000000000') {
      console.warn("MODULE_BLOCKED_NO_WEDDING_ID");
      setLoading(false);
      return;
    }
    // We don't set loading to true here to avoid aggressive UI loaders during realtime updates
    // Only set loading if we don't have data yet
    setLoading(prev => {
      // If we already have data, don't show loader
      return prev;
    });
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

  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedRefetch = useCallback((id: string, source: string) => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
      console.log(`REALTIME_REFETCH_SKIPPED (${source})`);
    }
    refetchTimeoutRef.current = setTimeout(() => {
      console.log(`REALTIME_REFETCH_TRIGGERED (${source})`);
      refetchAll(id);
    }, 1000);
  }, [refetchAll]);

  useEffect(() => {
    if (!weddingId || profileLoading || weddingId === '00000000-0000-0000-0000-000000000000' || !supabase) return;

    console.log("REALTIME_SUBSCRIBE_START", { weddingId });

    const channel = supabase!.channel(`wedding_data_${weddingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guests', filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          console.log("GUESTS_REALTIME_EVENT", payload);
          debouncedRefetch(weddingId, 'guests');
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guest_members' },
        (payload) => {
          // Check if the guest_member belongs to our wedding by looking at current guests
          const guestId = (payload.new as any)?.guest_id || (payload.old as any)?.guest_id;
          const belongsToWedding = weddingDataRef.current.guests.some(g => g.id === guestId);
          
          if (belongsToWedding) {
            console.log("GUESTS_REALTIME_EVENT (guest_members)", payload);
            debouncedRefetch(weddingId, 'guest_members');
          } else {
            // If we can't determine, we skip to avoid unnecessary refetches
            console.log("REALTIME_REFETCH_SKIPPED (guest_members - not in current wedding)");
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          console.log("TASKS_REALTIME_EVENT", payload);
          debouncedRefetch(weddingId, 'tasks');
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("REALTIME_SUBSCRIBE_OK");
        } else if (status === 'CLOSED') {
          console.log("REALTIME_UNSUBSCRIBE");
        } else if (status === 'CHANNEL_ERROR') {
          console.error("REALTIME_ERROR");
        }
      });

    return () => {
      console.log("REALTIME_UNSUBSCRIBE_START");
      supabase!.removeChannel(channel);
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, [weddingId, profileLoading, debouncedRefetch]);

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
