import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Razorpay → server webhook. Source of truth for "did the money actually arrive".
// Records the donation on payment.captured, idempotent on razorpay_payment_id so
// it never double-counts alongside the client-side donation-verify call.
//
// Configure in Razorpay Dashboard → Settings → Webhooks, pointing at this
// function's URL, subscribed to `payment.captured`, with a secret stored as
// RAZORPAY_WEBHOOK_SECRET.
serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    // Signature is computed over the RAW request body, so read text (not json).
    const raw = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';
    const expected = await hmacHex(Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!, raw);
    if (expected !== signature) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(raw);
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      const notes = payment?.notes || {};

      if (payment && notes.campaign_id) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        if (notes.type === 'feature') {
          // Feature payment — mark the campaign featured (backstop for the
          // client-side razorpay-verify call). Setting the same values twice
          // is harmless, so no idempotency key is needed.
          const days = Number(notes.days);
          if (days > 0) {
            const now = new Date();
            const featuredUntil = new Date(now);
            featuredUntil.setDate(featuredUntil.getDate() + days);
            await admin
              .from('campaigns')
              .update({
                is_featured: true,
                featured_until: featuredUntil.toISOString(),
                featured_since: now.toISOString(),
              })
              .eq('id', notes.campaign_id);
          }
        } else {
          // Donation (notes.type === 'donation', or legacy with no type).
          await admin.from('donations').upsert(
            {
              campaign_id: notes.campaign_id,
              donor_name: notes.donor_name || 'Anonymous',
              donor_email: notes.donor_email || payment.email,
              amount: Number(notes.donation_amount),
              razorpay_order_id: payment.order_id,
              razorpay_payment_id: payment.id,
              status: 'captured',
            },
            { onConflict: 'razorpay_payment_id', ignoreDuplicates: true }
          );
        }
      }
    } else if (event.event?.startsWith('payout.')) {
      const payout = event.payload?.payout?.entity;
      if (payout?.id) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        const { data: wd } = await admin
          .from('withdrawals')
          .select('campaign_id')
          .eq('razorpay_payout_id', payout.id)
          .maybeSingle();

        if (payout.status === 'processed') {
          // Payout confirmed — the creator has their money, so the campaign is
          // fully settled. Delete it (cascades donations + the withdrawal row).
          if (wd?.campaign_id) {
            await admin.from('campaigns').delete().eq('id', wd.campaign_id);
          }
        } else if (['failed', 'reversed', 'cancelled', 'rejected'].includes(payout.status)) {
          // Payout didn't go through — reopen the campaign so it can be claimed
          // again, and mark the withdrawal failed.
          await admin
            .from('withdrawals')
            .update({ status: 'failed' })
            .eq('razorpay_payout_id', payout.id);
          if (wd?.campaign_id) {
            await admin
              .from('campaigns')
              .update({ status: 'completed', withdrawn_at: null })
              .eq('id', wd.campaign_id);
          }
        } else {
          await admin
            .from('withdrawals')
            .update({ status: 'processing' })
            .eq('razorpay_payout_id', payout.id);
        }
      }
    }

    // Always 200 on a valid signature so Razorpay stops retrying.
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});

async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
