import { supabase } from './supabase';

export interface PushPayload {
  title: string;
  body: string;
  data: {
    url: string;
    type?: string;
  };
}

export const sendPushToWeddingTokens = async (weddingId: string, payload: PushPayload) => {
  console.log("PUSH_DISPATCH_START", { weddingId, payload });
  try {
    const { data: tokens, error } = await supabase!
      .from('notification_tokens')
      .select('token')
      .eq('wedding_id', weddingId)
      .eq('enabled', true);

    if (error) throw error;

    if (!tokens || tokens.length === 0) {
      console.log("PUSH_DISPATCH_TOKENS_FOUND", 0);
      console.log("PUSH_DISPATCH_DONE");
      return;
    }

    console.log("PUSH_DISPATCH_TOKENS_FOUND", tokens.length);

    const tokenList = tokens.map(t => t.token);
    let successCount = 0;
    let errorCount = 0;

    // Enviamos a cada token individualmente para no detenernos si uno falla
    for (const token of tokenList) {
      try {
        const { error: pushError } = await supabase!.functions.invoke('send-push', {
          body: {
            token, // Enviamos un solo token
            payload
          }
        });

        if (pushError) {
          console.error("PUSH_DISPATCH_TOKEN_ERROR", { token, error: pushError });
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error("PUSH_DISPATCH_TOKEN_ERROR", { token, error: err });
        errorCount++;
      }
    }

    console.log("PUSH_DISPATCH_OK", `Sent to ${successCount} tokens, ${errorCount} errors`);
    console.log("PUSH_DISPATCH_DONE");
  } catch (error) {
    console.error("PUSH_DISPATCH_TOKEN_ERROR", error);
    console.log("PUSH_DISPATCH_DONE");
  }
};

export const createAppNotification = async (
  weddingId: string,
  userId: string | null,
  type: string,
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'urgent',
  link: string
) => {
  console.log("NOTIF_CREATE_START", { type, title });
  try {
    // Evitar duplicados recientes (últimas 24h)
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
      console.log("NOTIF_CREATE_OK", "Duplicate prevented");
      return null;
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

export const createAndDispatchNotification = async (
  weddingId: string,
  userId: string | null,
  type: 'general' | 'rsvp_update' | 'task_due' | 'task_overdue' | 'vendor_due' | 'vendor_overdue' | 'budget_alert',
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'urgent',
  link: string
) => {
  if (type === 'rsvp_update') {
    console.log("RSVP_NOTIFICATION_START", { weddingId, type, title });
  } else if (type === 'general' || type === 'task_due' || type === 'task_overdue') {
    console.log("TASK_NOTIFICATION_START", { weddingId, type, title });
  }

  const notif = await createAppNotification(weddingId, userId, type, title, message, severity, link);
  if (notif) {
    await sendPushToWeddingTokens(weddingId, {
      title,
      body: message,
      data: {
        url: link,
        type
      }
    });
  }
};
