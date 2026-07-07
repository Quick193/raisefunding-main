import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { campaign_id, reporter_email, reason } = await req.json();
    const cleanEmail = String(reporter_email || '').trim().toLowerCase();
    const cleanReason = String(reason || '').trim();

    if (!campaign_id) return json({ error: 'Missing campaign_id' }, 400);
    if (cleanReason.length < 10 || cleanReason.length > 5000) {
      return json({ error: 'Report reason must be between 10 and 5000 characters.' }, 400);
    }
    if (cleanEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      return json({ error: 'A valid reporter email is required.' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const rateLimitKey = [
      clientIp(req),
      String(campaign_id),
      cleanEmail || 'anonymous',
    ].join(':');
    const { data: allowed, error: rateLimitError } = await admin.rpc('check_rate_limit', {
      p_scope: 'campaign_report',
      p_key: rateLimitKey,
      p_max_requests: 3,
      p_window_seconds: 3600,
    });
    if (rateLimitError) throw rateLimitError;
    if (!allowed) {
      return json({ error: 'Too many reports. Please try again later.' }, 429);
    }

    const { data: campaign, error: campaignError } = await admin
      .from('campaigns')
      .select('id')
      .eq('id', campaign_id)
      .maybeSingle();
    if (campaignError) throw campaignError;
    if (!campaign) return json({ error: 'Campaign not found' }, 404);

    const { error } = await admin.from('campaign_reports').insert({
      campaign_id,
      reporter_email: cleanEmail || null,
      reason: cleanReason,
      status: 'open',
    });
    if (error) throw error;

    return json({ success: true });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function clientIp(req: Request) {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
