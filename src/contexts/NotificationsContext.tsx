
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NotificationItem } from '../../types';
import { getNotificationsByWedding, markNotificationRead, markAllNotificationsRead, supabase } from '../../services/supabase';
import { useAuth } from '../lib/AuthContext';

interface Toast {
  id: string;
  notification: NotificationItem;
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  toasts: Toast[];
  refetch: (weddingId: string, userId?: string) => Promise<void>;
  markRead: (id: string, weddingId: string) => Promise<void>;
  markAllRead: (weddingId: string, userId?: string) => Promise<void>;
  dismissToast: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode, weddingId: string | null, userId: string | null }> = ({ children, weddingId, userId }) => {
  const { session, authUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const refetch = useCallback(async (id: string, uid?: string, isFromRealtime = false) => {
    if (!id || id === '00000000-0000-0000-0000-000000000000') {
      console.warn("MODULE_BLOCKED_NO_WEDDING_ID");
      setLoading(false);
      return;
    }
    
    setLoading(prev => !initialLoadDoneRef.current ? true : prev);
    
    const { data, error: fetchError } = await getNotificationsByWedding(id, uid);
    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      if (!initialLoadDoneRef.current || !isFromRealtime) {
        // Initial load or non-realtime fetch (e.g. auth change)
        const newIdsCount = data.length;
        data.forEach(n => knownIdsRef.current.add(n.id));
        
        if (!initialLoadDoneRef.current) {
          console.log("NOTIF_INITIAL_LOAD");
          console.log("NOTIF_INITIAL_IDS_REGISTERED", newIdsCount);
          initialLoadDoneRef.current = true;
        } else {
          console.log("NOTIF_REPLAY_PREVENTED", newIdsCount);
        }
      } else {
        // Realtime fetching
        const newNotifs = data.filter(n => !n.isRead && !knownIdsRef.current.has(n.id));
        const skippedNotifs = data.filter(n => !n.isRead && knownIdsRef.current.has(n.id));
        
        if (skippedNotifs.length > 0) {
          console.log("NOTIF_REALTIME_SKIPPED_ALREADY_KNOWN", skippedNotifs.length);
        }

        newNotifs.forEach(n => {
          console.log("NOTIF_REALTIME_NEW", n.id);
          knownIdsRef.current.add(n.id);
          const toastId = Math.random().toString(36).substr(2, 9);
          setToasts(prev => [...prev, { id: toastId, notification: n }]);
          // Auto-dismiss toast after 5 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toastId));
          }, 5000);
        });
      }
      
      setNotifications(data);
      setError(null);
    }
    setLoading(false);
  }, []);

  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedRefetch = useCallback((id: string, uid?: string) => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
      console.log(`REALTIME_REFETCH_SKIPPED (notifications)`);
    }
    refetchTimeoutRef.current = setTimeout(() => {
      console.log(`REALTIME_REFETCH_TRIGGERED (notifications)`);
      refetch(id, uid, true);
    }, 1000);
  }, [refetch]);

  useEffect(() => {
    const currentWeddingId = userProfile?.wedding_id || weddingId;
    
    console.log("NOTIF_REALTIME_SUBSCRIBE_ATTEMPT", { 
      hasSession: !!session, 
      hasUserId: !!authUser?.id, 
      hasProfile: !!userProfile, 
      weddingId: currentWeddingId 
    });

    if (!session) {
      console.log("NOTIF_REALTIME_SUBSCRIBE_SKIPPED_NO_SESSION");
      return;
    }
    if (!userProfile) {
      console.log("NOTIF_REALTIME_SUBSCRIBE_SKIPPED_NO_PROFILE");
      return;
    }
    if (!currentWeddingId || currentWeddingId === '00000000-0000-0000-0000-000000000000') {
      console.log("NOTIF_REALTIME_SUBSCRIBE_SKIPPED_NO_WEDDING");
      return;
    }
    if (!supabase) return;

    const channel = supabase.channel(`notifications_${currentWeddingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `wedding_id=eq.${currentWeddingId}` },
        (payload) => {
          console.log("NOTIFS_REALTIME_EVENT", payload);
          debouncedRefetch(currentWeddingId, authUser?.id || userId || undefined);
        }
      )
      .subscribe((status) => {
        console.log("NOTIF_REALTIME_CHANNEL_STATUS", { status, module: 'notifications' });
        if (status === 'SUBSCRIBED') {
          console.log("NOTIF_REALTIME_SUBSCRIBED", { module: 'notifications' });
        } else if (status === 'CLOSED') {
          console.log("NOTIF_REALTIME_UNSUBSCRIBE", { module: 'notifications' });
        } else if (status === 'CHANNEL_ERROR') {
          console.error("NOTIF_REALTIME_ERROR_FULL", { module: 'notifications' });
        }
      });

    return () => {
      console.log("NOTIF_REALTIME_UNSUBSCRIBE", { module: 'notifications' });
      supabase.removeChannel(channel);
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, [session, authUser?.id, userProfile?.wedding_id, weddingId, userId, debouncedRefetch]);

  useEffect(() => {
    if (weddingId) {
      refetch(weddingId, userId || undefined);
    }
  }, [weddingId, userId, refetch]);

  const markRead = async (id: string, weddingId: string) => {
    console.log("NOTIF_MARK_READ_START", { id, weddingId });
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    const { error } = await markNotificationRead(id, weddingId);
    if (!error) {
      console.log("NOTIF_MARK_READ_OK", { id });
    } else {
      console.error("NOTIF_MARK_READ_ERROR", error);
      // Revert on error
      refetch(weddingId, userId || undefined);
    }
  };

  const markAllRead = async (weddingId: string, userId?: string) => {
    console.log("MARK_ALL_READ_START", { weddingId, userId });
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    const { error } = await markAllNotificationsRead(weddingId, userId);
    if (!error) {
      console.log("MARK_ALL_READ_OK");
    } else {
      console.error("MARK_ALL_READ_ERROR", error);
      // Revert on error
      refetch(weddingId, userId || undefined);
    }
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      toasts,
      refetch,
      markRead,
      markAllRead,
      dismissToast
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
