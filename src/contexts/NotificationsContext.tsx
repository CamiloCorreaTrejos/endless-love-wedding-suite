
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NotificationItem } from '../../types';
import { getNotificationsByWedding, markNotificationRead, markAllNotificationsRead, supabase } from '../../services/supabase';

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const notificationsRef = useRef<NotificationItem[]>([]);
  
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const refetch = useCallback(async (id: string, uid?: string) => {
    if (!id || id === '00000000-0000-0000-0000-000000000000') {
      console.warn("MODULE_BLOCKED_NO_WEDDING_ID");
      setLoading(false);
      return;
    }
    setLoading(prev => notificationsRef.current.length === 0 ? true : prev);
    const { data, error } = await getNotificationsByWedding(id, uid);
    if (error) {
      setError(error.message);
    } else if (data) {
      // Check for new notifications to show toasts
      const currentNotifs = notificationsRef.current;
      if (currentNotifs.length > 0) {
        const newNotifs = data.filter(n => !n.isRead && !currentNotifs.find(old => old.id === n.id));
        newNotifs.forEach(n => {
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
      refetch(id, uid);
    }, 1000);
  }, [refetch]);

  useEffect(() => {
    if (!weddingId || weddingId === '00000000-0000-0000-0000-000000000000' || !supabase) return;

    console.log("REALTIME_SUBSCRIBE_START", { weddingId, module: 'notifications' });

    const channel = supabase!.channel(`notifications_${weddingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `wedding_id=eq.${weddingId}` },
        (payload) => {
          console.log("NOTIFS_REALTIME_EVENT", payload);
          debouncedRefetch(weddingId, userId || undefined);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("REALTIME_SUBSCRIBE_OK", { module: 'notifications' });
        } else if (status === 'CLOSED') {
          console.log("REALTIME_UNSUBSCRIBE", { module: 'notifications' });
        } else if (status === 'CHANNEL_ERROR') {
          console.error("REALTIME_ERROR", { module: 'notifications' });
        }
      });

    return () => {
      console.log("REALTIME_UNSUBSCRIBE_START", { module: 'notifications' });
      supabase!.removeChannel(channel);
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, [weddingId, userId, debouncedRefetch]);

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
