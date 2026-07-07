import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Razorpay → server webhook. Source of truth for "did the money actually arrive".
// Records the donation on payment.captured, idempotent on razorpay_payment_id so
// it never double-counts alongside the client-side donation-verify call.
//
// Configure in Razorpay Dashboard → Settings → Webhooks, pointing at this
// function's URL, subscribed to `payment.captured`, with a secret stored as
// RAZORPAY_WEBHOOK_SECRET.
const FEATURE_FEES_PAISE: Record<number, number> = {
  7: 50000,
  30: 200000,
  90: 500000,
};

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
          // Feature payment backstop. The payment id is consumed once in
          // feature_payments so a captured payment cannot be replayed.
          const days = Number(notes.days);
          const expectedAmount = FEATURE_FEES_PAISE[days];
          if (expectedAmount && Number(payment.amount) === expectedAmount) {
            const { data: campaign } = await admin
              .from('campaigns')
              .select('id, creator_id')
              .eq('id', notes.campaign_id)
              .single();

            if (campaign && notes.creator_id && notes.creator_id !== campaign.creator_id) {
              throw new Error('Feature payment creator mismatch');
            }

            const { data: existingPayment } = await admin
              .from('feature_payments')
              .select('campaign_id')
              .eq('razorpay_payment_id', payment.id)
              .maybeSingle();

            let shouldApplyFeature = false;
            if (campaign && !existingPayment) {
              const { error: featurePaymentError } = await admin.from('feature_payments').insert({
                campaign_id: campaign.id,
                creator_id: campaign.creator_id,
                razorpay_order_id: payment.order_id,
                razorpay_payment_id: payment.id,
                amount_paise: expectedAmount,
                days,
              });
              if (featurePaymentError && featurePaymentError.code !== '23505') {
                throw featurePaymentError;
              }
              shouldApplyFeature = !featurePaymentError;
            }

            if (shouldApplyFeature) {
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
          }
        } else {
          // Donation (notes.type === 'donation', or legacy with no type).
          const { error: donationError } = await admin.rpc('record_verified_donation', {
            p_campaign_id: notes.campaign_id,
            p_donor_name: notes.donor_name || 'Anonymous',
            p_donor_email: notes.donor_email || payment.email,
            p_amount: Number(notes.donation_amount),
            p_razorpay_order_id: payment.order_id,
            p_razorpay_payment_id: payment.id,
          });
          if (donationError) {
            console.error('Donation recording failed:', donationError.message);
          }
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
          // Payout confirmed — keep the financial audit trail and mark settlement.
          await admin
            .from('withdrawals')
            .update({ status: 'processed', processed_at: new Date().toISOString() })
            .eq('razorpay_payout_id', payout.id);
          if (wd?.campaign_id) {
            await admin
              .from('campaigns')
              .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
              .eq('id', wd.campaign_id);
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
          if (wd?.campaign_id) {
            await admin
              .from('campaigns')
              .update({ status: 'withdrawal_pending', withdrawn_at: null })
              .eq('id', wd.campaign_id)
              .neq('status', 'withdrawn');
          }
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
