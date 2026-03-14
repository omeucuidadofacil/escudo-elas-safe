import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[telegram-poll] LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    if (!TELEGRAM_API_KEY) {
      console.error('[telegram-poll] TELEGRAM_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read offset
    const { data: state, error: stateErr } = await supabase
      .from('telegram_bot_state')
      .select('update_offset')
      .eq('id', 1)
      .single();

    if (stateErr) {
      console.error('[telegram-poll] State read error:', stateErr.message);
      return new Response(JSON.stringify({ error: 'state_read_error', detail: stateErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentOffset = state.update_offset;
    console.log(`[telegram-poll] Offset: ${currentOffset}`);

    // Single short poll — no long polling to avoid 409 conflicts
    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout: 0,
        allowed_updates: ['message'],
      }),
    });

    const data = await response.json();
    console.log(`[telegram-poll] getUpdates status=${response.status}, result_count=${data.result?.length ?? 0}`);

    if (!response.ok) {
      console.error('[telegram-poll] getUpdates error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'telegram_error', status: response.status, detail: data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updates = data.result ?? [];
    let sent = 0;
    const replies: string[] = [];

    for (const update of updates) {
      console.log(`[telegram-poll] Processing update_id=${update.update_id}, text="${update.message?.text}"`);

      // Handle /start or "começar" variants
      const msgText = (update.message?.text ?? '').trim().toLowerCase().replace(/[\/]/g, '');
      if (msgText === 'start' || msgText === 'começar' || msgText === 'comecar') {
        const chatId = update.message.chat.id;
        const firstName = update.message.from?.first_name || '';

        const replyText =
          `👋 Olá${firstName ? `, ${firstName}` : ''}! Eu sou o bot da *Valkyra*.\n\n` +
          `🔑 Seu *Chat ID* é:\n\`${chatId}\`\n\n` +
          `📋 Copie esse número e cole no campo "Telegram Chat ID" nas configurações do app Valkyra.\n\n` +
          `Assim, quando alguém ativar um alerta SOS, você receberá a notificação aqui! 🛡️`;

        console.log(`[telegram-poll] Sending /start reply to chat_id=${chatId}`);

        const sendResp = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TELEGRAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'Markdown',
          }),
        });

        const sendData = await sendResp.json();
        console.log(`[telegram-poll] sendMessage status=${sendResp.ok}, data=${JSON.stringify(sendData).substring(0, 200)}`);
        replies.push(`chat_id=${chatId} ok=${sendResp.ok}`);
        if (sendResp.ok) sent++;
      }

      // Store message
      if (update.message) {
        await supabase.from('telegram_messages').upsert({
          update_id: update.update_id,
          chat_id: update.message.chat.id,
          text: update.message.text ?? null,
          raw_update: update,
        }, { onConflict: 'update_id' });
      }
    }

    // Advance offset
    if (updates.length > 0) {
      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      console.log(`[telegram-poll] Advancing offset ${currentOffset} -> ${newOffset}`);
      await supabase
        .from('telegram_bot_state')
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq('id', 1);
    }

    return new Response(JSON.stringify({
      ok: true,
      offset: currentOffset,
      updates_count: updates.length,
      sent,
      replies,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[telegram-poll] Uncaught error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
