import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Scheduled housekeeping (intended to run ~monthly). Deletes up to 30 of the
// oldest FULLY-SETTLED campaigns — status 'withdrawn' (paid out to the creator)
// or 'refunded' (returned to donors). Campaigns that are merely 'completed' are
// never purged here: they may still hold claimable/refundable money, and they
// flow to withdrawn/refunded first via the daily refund-expired job.
//
// Deleting a campaign cascades to its donations (FK ON DELETE CASCADE), which
// is safe once the money has been settled.
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

  // Oldest settled campaigns first.
  const { data: rows, error: selErr } = await admin
    .from('campaigns')
    .select('id')
    .in('status', ['withdrawn', 'refunded'])
    .order('created_at', { ascending: true })
    .limit(30);
  if (selErr) return json({ error: selErr.message }, 500);

  const ids = (rows ?? []).map((r) => r.id);
  if (ids.length === 0) return json({ purged: 0 });

  const { error: delErr } = await admin.from('campaigns').delete().in('id', ids);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({ purged: ids.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
