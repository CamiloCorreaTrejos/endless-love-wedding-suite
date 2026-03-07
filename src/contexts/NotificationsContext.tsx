
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../../types';
import { getNotificationsByWedding, markNotificationRead, markAllNotificationsRead } from '../../services/supabase';

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

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const notificationsRef = React.useRef<NotificationItem[]>([]);
  
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const refetch = useCallback(async (weddingId: string, userId?: string) => {
    if (!weddingId || weddingId === '00000000-0000-0000-0000-000000000000') {
      console.warn("MODULE_BLOCKED_NO_WEDDING_ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getNotificationsByWedding(weddingId, userId);
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

  const markRead = async (id: string, weddingId: string) => {
    const { error } = await markNotificationRead(id, weddingId);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const markAllRead = async (weddingId: string, userId?: string) => {
    const { error } = await markAllNotificationsRead(weddingId, userId);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
