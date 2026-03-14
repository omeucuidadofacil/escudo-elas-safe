import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, latitude, longitude } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, telefone_celular')
      .eq('user_id', user_id)
      .single();

    const userName = profile?.nome || 'Usuária';

    // Get emergency contacts with telegram_chat_id
    const { data: contacts } = await supabase
      .from('contatos_emergencia')
      .select('nome, telefone, telegram_chat_id')
      .eq('user_id', user_id);

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: 'No contacts found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let locationText = '';
    if (latitude && longitude) {
      locationText = `\n📍 Localização: https://www.google.com/maps?q=${latitude},${longitude}`;
    }

    const message = `🚨 <b>ALERTA SOS - VALKYRA</b> 🚨\n\n` +
      `<b>${userName}</b> ativou um alerta de emergência!` +
      `${locationText}\n\n` +
      `⚠️ Entre em contato imediatamente.\n` +
      `📞 Telefone: ${profile?.telefone_celular || 'não informado'}`;

    let sentCount = 0;
    const errors: string[] = [];

    for (const contact of contacts) {
      const chatId = contact.telegram_chat_id?.trim();
      if (!chatId) continue;

      try {
        const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TELEGRAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        });

        const data = await response.json();
        if (response.ok) {
          sentCount++;
        } else {
          errors.push(`${contact.nome}: ${JSON.stringify(data)}`);
        }
      } catch (e) {
        errors.push(`${contact.nome}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: sentCount, errors }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
