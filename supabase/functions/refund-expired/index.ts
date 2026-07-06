import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Scheduled job (called by the daily cron). For every campaign that closed
// (status 'completed') and whose 30-day claim window has lapsed without a
// withdrawal, refund each donation and mark the campaign 'refunded'. Refunds
// the donation amount only — voluntary tips are platform revenue and kept.
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
  const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
  const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
  const auth = `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`;

  const nowIso = new Date().toISOString();

  // Step 1: close campaigns whose funding period has ended (end_date before
  // today), starting their 30-day claim window. Goal-reached campaigns are
  // already closed + stamped by the donation trigger.
  const claimDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await admin
    .from('campaigns')
    .update({ status: 'completed', claim_deadline: claimDeadline })
    .eq('status', 'active')
    .not('end_date', 'is', null)
    .lt('end_date', nowIso.split('T')[0]);

  // Backfill a claim window for any 'completed' campaign missing one (e.g.
  // legacy campaigns completed before the escrow model), so they get their
  // 30 days and then flow into the refund + purge pipeline.
  await admin
    .from('campaigns')
    .update({ claim_deadline: claimDeadline })
    .eq('status', 'completed')
    .is('claim_deadline', null);

  // Step 2: refund campaigns that closed and were never withdrawn within the
  // claim window. Batch to avoid timeouts.
  const { data: campaigns, error } = await admin
    .from('campaigns')
    .select('id')
    .eq('status', 'completed')
    .lt('claim_deadline', nowIso)
    .limit(20);
  if (error) return json({ error: error.message }, 500);

  let refundedCampaigns = 0;
  let refundedDonations = 0;

  for (const campaign of campaigns ?? []) {
    const { data: donations } = await admin
      .from('donations')
      .select('id, amount, razorpay_payment_id, refund_status')
      .eq('campaign_id', campaign.id)
      .not('razorpay_payment_id', 'is', null);

    for (const d of donations ?? []) {
      if (d.refund_status === 'processed' || d.refund_status === 'processing') continue;

      const res = await fetch(
        `https://api.razorpay.com/v1/payments/${d.razorpay_payment_id}/refund`,
        {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Math.round(Number(d.amount) * 100) }),
        }
      );
      const refund = await res.json();
      if (res.ok) {
        await admin
          .from('donations')
          .update({
            refund_id: refund.id,
            refund_status: refund.status || 'processing',
            refunded_at: nowIso,
          })
          .eq('id', d.id);
        refundedDonations++;
      } else {
        await admin.from('donations').update({ refund_status: 'failed' }).eq('id', d.id);
      }
    }

    await admin.from('campaigns').update({ status: 'refunded' }).eq('id', campaign.id);
    refundedCampaigns++;
  }

  return json({ refundedCampaigns, refundedDonations });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
