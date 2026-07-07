import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Scheduled housekeeping (intended to run ~monthly). Campaigns are never deleted
// — donations, withdrawals, and refunds are financial audit records. Instead,
// the oldest ended campaigns are ARCHIVED: kept in the database but hidden from
// the public browse listing. Direct links and the creator's dashboard still
// show them.
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

  // Oldest ended, not-yet-archived campaigns first.
  const { data: rows, error: selErr } = await admin
    .from('campaigns')
    .select('id')
    .neq('status', 'active')
    .is('archived_at', null)
    .order('created_at', { ascending: true })
    .limit(30);
  if (selErr) return json({ error: selErr.message }, 500);

  const ids = (rows ?? []).map((r) => r.id);
  if (ids.length === 0) return json({ archived: 0 });

  const { error: updErr } = await admin
    .from('campaigns')
    .update({ archived_at: new Date().toISOString() })
    .in('id', ids);
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ archived: ids.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
