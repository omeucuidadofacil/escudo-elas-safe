// Send FCM push notifications to nearby users when SOS is triggered
// Uses FCM HTTP v1 API with Service Account JWT (Android only for now)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

interface Body {
  alerta_id?: string;
  latitude: number;
  longitude: number;
  nome_usuario?: string;
  radius_km?: number;
}

// Convert PEM private key to CryptoKey
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const bin = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'pkcs8',
    bin,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const key = await importPrivateKey(serviceAccount.private_key);
  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
    },
    key,
  );

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Failed to get FCM access token: ' + JSON.stringify(data));
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!saJson) {
      return new Response(
        JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT_JSON not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const serviceAccount = JSON.parse(saJson);
    const projectId = serviceAccount.project_id;

    const body: Body = await req.json();
    const { latitude, longitude, nome_usuario, radius_km = 5, alerta_id } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch all device tokens (android). Filter by geo client-side via profiles if needed.
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token, user_id, platform')
      .eq('platform', 'android');

    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'no tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);
    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

    const results = await Promise.allSettled(
      tokens.map((t) =>
        fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: t.token,
              notification: {
                title: '🚨 ALERTA SOS - Valkyra',
                body: `${nome_usuario || 'Uma usuária'} precisa de ajuda agora!`,
              },
              data: {
                alerta_id: alerta_id || '',
                latitude: String(latitude),
                longitude: String(longitude),
                url: mapsUrl,
              },
              android: {
                priority: 'HIGH',
                notification: {
                  sound: 'default',
                  channel_id: 'sos_alerts',
                  notification_priority: 'PRIORITY_MAX',
                  default_vibrate_timings: true,
                },
              },
            },
          }),
        }).then((r) => r.json()),
      ),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return new Response(
      JSON.stringify({ sent, failed, total: tokens.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('send-push-sos error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
