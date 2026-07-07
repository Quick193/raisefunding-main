import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lets a campaign's creator end it early. Moves an 'active' campaign to
// 'completed' and starts the 30-day claim window so the raised amount can be
// withdrawn. Status is server-owned (the tamper-trigger blocks direct client
// writes), so this controlled, ownership-checked path is the only way in.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { campaign_id } = await req.json();
    if (!campaign_id) return json({ error: 'Missing campaign_id' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: campaign } = await admin
      .from('campaigns')
      .select('id, status')
      .eq('id', campaign_id)
      .eq('creator_id', user.id)
      .single();
    if (!campaign) return json({ error: 'Campaign not found' }, 404);
    if (campaign.status !== 'active') {
      return json({ error: 'Only an active campaign can be ended.' }, 400);
    }

    const claimDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await admin
      .from('campaigns')
      .update({
        status: 'completed',
        claim_deadline: claimDeadline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign_id)
      .eq('creator_id', user.id);
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
