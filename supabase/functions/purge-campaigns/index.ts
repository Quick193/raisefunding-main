import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Scheduled housekeeping placeholder. Settled campaigns are intentionally
// retained because donations, withdrawals, and refunds are financial audit
// records. Public listing queries already hide non-active campaigns.
//
// Protected by a shared secret so only the scheduler can invoke it.
serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Forbidden', { status: 403 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: rows, error: selErr } = await admin
    .from('campaigns')
    .select('id')
    .in('status', ['withdrawn', 'refunded'])
    .order('created_at', { ascending: true })
    .limit(30);
  if (selErr) return json({ error: selErr.message }, 500);

  const ids = (rows ?? []).map((r) => r.id);
  return json({ retained: ids.length, purged: 0 });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
