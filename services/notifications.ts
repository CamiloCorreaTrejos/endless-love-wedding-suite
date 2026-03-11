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
  const isRsvp = payload.type === 'rsvp_update';
  const isTask = payload.type === 'general' || payload.type.startsWith('task_');

  if (isRsvp) console.log("RSVP_PUSH_EDGE_START", payload);
  else if (isTask) console.log("TASK_PUSH_EDGE_START", payload);
  else console.log("PUSH_EDGE_START", payload);

  if (isTask) console.log("TASK_PUSH_EDGE_PAYLOAD", payload);

  try {
    // Fetch and deduplicate tokens in the database before dispatch
    const { data: tokensData, error: tokensError } = await supabase!
      .from('notification_tokens')
      .select('id, token')
      .eq('wedding_id', payload.wedding_id)
      .eq('enabled', true);

    if (tokensError) throw tokensError;

    if (!tokensData || tokensData.length === 0) {
      if (isRsvp) console.log("RSVP_PUSH_EDGE_ALREADY_SENT_SKIPPED", "No tokens found");
      return;
    }

    // Clean up duplicate tokens in the database to ensure the Edge Function only sends once per token
    const seenTokens = new Set<string>();
    const duplicateIds: string[] = [];
    
    for (const t of tokensData) {
      if (seenTokens.has(t.token)) {
        duplicateIds.push(t.id);
      } else {
        seenTokens.add(t.token);
      }
    }

    if (duplicateIds.length > 0) {
      console.log("CLEANING_UP_DUPLICATE_TOKENS", duplicateIds.length);
      await supabase!.from('notification_tokens').delete().in('id', duplicateIds);
    }

    const uniqueTokens = Array.from(seenTokens);

    const { error } = await supabase!.functions.invoke('send-push-notification', {
      body: {
        ...payload,
        tokens: uniqueTokens // Pasamos los tokens únicos por si la Edge Function los usa
      }
    });

    if (error) throw error;

    if (isRsvp) console.log("RSVP_PUSH_EDGE_OK");
    else if (isTask) console.log("TASK_PUSH_EDGE_OK");
    else console.log("PUSH_EDGE_OK");
  } catch (error) {
    if (isTask) console.error("TASK_PUSH_EDGE_ERROR", error);
    else console.error("PUSH_EDGE_ERROR", error);
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
  else if (type.startsWith('task_') || type === 'general') console.log("TASK_NOTIFICATION_START", { weddingId, title });
  else if (type.startsWith('vendor_')) console.log("VENDOR_NOTIFICATION_START", { weddingId, title });
  else if (type === 'budget_alert') console.log("BUDGET_NOTIFICATION_START", { weddingId, title });

  console.log("NOTIF_CREATE_START", { type, title });

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
        if (type === 'rsvp_update') {
          console.log("RSVP_PUSH_EDGE_ALREADY_SENT_SKIPPED");
        }
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
