import { supabase } from './supabase';

export type NotificationType = 'general' | 'rsvp_update' | 'task_due' | 'task_overdue' | 'vendor_due' | 'vendor_overdue' | 'budget_alert';
export type NotificationSeverity = 'info' | 'warning' | 'urgent';

export interface NotificationPayload {
  weddingId: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  link: string;
}

/**
 * Invoca la Edge Function send-push-notification para enviar push real.
 * Payload esperado por la Edge Function: wedding_id, title, message, link, type
 */
export const dispatchPushNotification = async (payload: {
  wedding_id: string;
  title: string;
  message: string;
  link: string;
  type: string;
}) => {
  console.log("PUSH_EDGE_START", payload);
  try {
    const { error } = await supabase!.functions.invoke('send-push-notification', {
      body: payload
    });

    if (error) throw error;
    console.log("PUSH_EDGE_OK");
  } catch (error) {
    console.error("PUSH_EDGE_ERROR", error);
    // No lanzamos error para no romper el flujo principal si falla el push
  }
};

/**
 * Inserta una fila en la tabla notifications con prevención de duplicados para tipos automáticos.
 */
export const createAppNotification = async (
  weddingId: string,
  userId: string | null,
  type: NotificationType,
  title: string,
  message: string,
  severity: NotificationSeverity,
  link: string
) => {
  // Logs por módulo
  if (type === 'rsvp_update') console.log("RSVP_NOTIFICATION_START", { weddingId, title });
  else if (type.startsWith('task_')) console.log("TASK_NOTIFICATION_START", { weddingId, title });
  else if (type.startsWith('vendor_')) console.log("VENDOR_NOTIFICATION_START", { weddingId, title });
  else if (type === 'budget_alert') console.log("BUDGET_NOTIFICATION_START", { weddingId, title });

  console.log("NOTIF_CREATE_START", { type, title });

  try {
    // Evitar duplicados recientes (últimas 24h) para tipos automáticos (Tasks, Vendors, Budget)
    const autoTypes: NotificationType[] = ['task_due', 'task_overdue', 'vendor_due', 'vendor_overdue', 'budget_alert'];
    if (autoTypes.includes(type)) {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const { data: existing, error: checkError } = await supabase!
        .from('notifications')
        .select('id')
        .eq('wedding_id', weddingId)
        .eq('type', type)
        .eq('title', title)
        .eq('message', message)
        .gte('created_at', yesterday.toISOString())
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        console.log("NOTIF_DUPLICATE_SKIPPED", { type, title });
        return null;
      }
    }

    const { data, error } = await supabase!
      .from('notifications')
      .insert({
        wedding_id: weddingId,
        user_id: userId,
        type,
        title,
        message,
        severity,
        link,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    console.log("NOTIF_CREATE_OK");
    return data;
  } catch (error) {
    console.error("NOTIF_CREATE_ERROR", error);
    return null;
  }
};

/**
 * Función central: Inserta en DB y despacha Push vía Edge Function.
 */
export const createAndDispatchNotification = async (
  weddingId: string,
  userId: string | null,
  type: NotificationType,
  title: string,
  message: string,
  severity: NotificationSeverity,
  link: string
) => {
  const notif = await createAppNotification(weddingId, userId, type, title, message, severity, link);
  
  // Si se insertó (no era duplicado bloqueado), llamamos a la Edge Function
  if (notif) {
    await dispatchPushNotification({
      wedding_id: weddingId,
      title,
      message,
      link,
      type
    });
  }
};
