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
  user_id?: string | null;
  title: string;
  message: string;
  link: string;
  type: string;
}) => {
  const isRsvp = payload.type === 'rsvp_update';
  const isTask = payload.type === 'general' || payload.type.startsWith('task_');
  const isVendor = payload.type.startsWith('vendor_');
  const isBudget = payload.type === 'budget_alert';

  if (isTask) {
    console.log("TASK_NOTIFICATION_START");
  } else if (isRsvp) {
    console.log("RSVP_NOTIFICATION_START");
  } else if (isVendor) {
    console.log("VENDOR_NOTIFICATION_START");
  } else if (isBudget) {
    console.log("BUDGET_NOTIFICATION_START");
  }

  // Deduplication and cleanup goes to Edge function because client with RLS can't read other users' tokens.
  // We send the notification request directly to the Edge Function.
  
  // Exact payload requested
  const finalPayload = {
    wedding_id: String(payload.wedding_id || ''),
    title: String(payload.title || ''),
    message: String(payload.message || ''),
    link: String(payload.link || ''),
    type: String(payload.type || 'general'),
  };

  console.log("PUSH_EDGE_START");
  console.log("PUSH_EDGE_PAYLOAD", finalPayload);

  try {
    const response = await supabase!.functions.invoke('send-push-notification', {
      body: finalPayload,
      method: 'POST'
    });

    const { data, error } = response;

    if (error) {
      console.error("PUSH_EDGE_ERROR_FULL", {
        name: error.name,
        message: error.message,
        context: error.context,
        status: (error as any).status,
        response: data || (error as any).response,
        body: data
      });
      return;
    }

    console.log("PUSH_EDGE_RESULT", data);
    console.log("PUSH_EDGE_OK");
  } catch (error: any) {
    console.error("PUSH_EDGE_ERROR_FULL", {
      name: error.name,
      message: error.message,
      context: error.context,
      status: error.status,
      response: error.response,
      body: null
    });
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
  console.log("NOTIF_CREATE_START", { type, title, message, severity, link });

  try {
    // Evitar duplicados recientes (últimas 24h para automáticos, 1 min para RSVP y general)
    const autoTypes: NotificationType[] = ['task_due', 'task_overdue', 'vendor_due', 'vendor_overdue', 'budget_alert'];
    const isAuto = autoTypes.includes(type);
    const isRsvpOrGeneral = type === 'rsvp_update' || type === 'general';

    if (isAuto || isRsvpOrGeneral) {
      const timeLimit = new Date();
      if (isAuto) {
        timeLimit.setHours(timeLimit.getHours() - 24);
      } else {
        timeLimit.setMinutes(timeLimit.getMinutes() - 1); // 1 minuto para evitar doble submit
      }

      const { data: existing, error: checkError } = await supabase!
        .from('notifications')
        .select('id')
        .eq('wedding_id', weddingId)
        .eq('type', type)
        .eq('title', title)
        .eq('message', message)
        .gte('created_at', timeLimit.toISOString())
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
    
    console.log("NOTIF_CREATE_OK", { id: data.id });

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
      user_id: userId,
      title,
      message,
      link,
      type
    });
  }
};
