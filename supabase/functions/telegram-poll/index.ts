import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[telegram-poll] Starting poll cycle');

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.error('[telegram-poll] LOVABLE_API_KEY is not configured');
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500 });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    console.error('[telegram-poll] TELEGRAM_API_KEY is not configured');
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), { status: 500 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let totalProcessed = 0;

  // Read initial offset
  const { data: state, error: stateErr } = await supabase
    .from('telegram_bot_state')
    .select('update_offset')
    .eq('id', 1)
    .single();

  if (stateErr) {
    console.error('[telegram-poll] Error reading state:', stateErr.message);
    return new Response(JSON.stringify({ error: stateErr.message }), { status: 500 });
  }

  let currentOffset = state.update_offset;
  console.log('[telegram-poll] Current offset:', currentOffset);

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = MAX_RUNTIME_MS - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    // Use short timeout (5s) to avoid pg_net killing the connection
    const timeout = Math.min(5, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    console.log(`[telegram-poll] Polling with timeout=${timeout}s, remaining=${Math.floor(remainingMs/1000)}s`);

    try {
      const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offset: currentOffset,
          timeout,
          allowed_updates: ['message'],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('[telegram-poll] getUpdates error:', JSON.stringify(data));
        return new Response(JSON.stringify({ error: data }), { status: 502 });
      }

      const updates = data.result ?? [];
      console.log(`[telegram-poll] Got ${updates.length} updates`);

      if (updates.length === 0) continue;

      // Store messages
      const rows = updates
        .filter((u: any) => u.message)
        .map((u: any) => ({
          update_id: u.update_id,
          chat_id: u.message.chat.id,
          text: u.message.text ?? null,
          raw_update: u,
        }));

      if (rows.length > 0) {
        const { error: insertErr } = await supabase
          .from('telegram_messages')
          .upsert(rows, { onConflict: 'update_id' });

        if (insertErr) {
          console.error('[telegram-poll] Insert error:', insertErr.message);
        }
        totalProcessed += rows.length;
      }

      // Handle /start commands
      for (const update of updates) {
        if (update.message?.text?.trim() === '/start') {
          const chatId = update.message.chat.id;
          const firstName = update.message.from?.first_name || '';

          console.log(`[telegram-poll] Responding to /start from chat ${chatId}`);

          const replyText =
            `👋 Olá${firstName ? `, ${firstName}` : ''}! Eu sou o bot da *Valkyra*.\n\n` +
            `🔑 Seu *Chat ID* é:\n\`${chatId}\`\n\n` +
            `📋 Copie esse número e cole no campo "Telegram Chat ID" nas configurações do app Valkyra.\n\n` +
            `Assim, quando alguém ativar um alerta SOS, você receberá a notificação aqui! 🛡️`;

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
          console.log(`[telegram-poll] sendMessage result: ok=${sendResp.ok}`, JSON.stringify(sendData));
        }
      }

      // Advance offset
      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      await supabase
        .from('telegram_bot_state')
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq('id', 1);

      currentOffset = newOffset;
    } catch (fetchErr) {
      console.error('[telegram-poll] Fetch error:', fetchErr instanceof Error ? fetchErr.message : fetchErr);
      // Wait a bit before retrying
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`[telegram-poll] Done. Processed ${totalProcessed} updates.`);
  return new Response(JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }));
});
