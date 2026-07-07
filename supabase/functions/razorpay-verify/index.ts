import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEATURE_FEES_PAISE: Record<number, number> = {
  7: 50000,
  30: 200000,
  90: 500000,
};

// Verifies a featuring payment and flips the campaign to featured. The featured
// duration is read from the ORDER's notes (set server-side in razorpay-order),
// never from the client, so a paid-for plan can't be upgraded for free.
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, campaign_id } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing payment fields' }, 400);
    }

    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // 1. Verify the payment signature.
    const expected = await hmacHex(KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) {
      return json({ error: 'Payment signature mismatch' }, 400);
    }

    // 2. Fetch the order to read the authoritative plan (days) we stored on it.
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: { Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}` },
    });
    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(order.error?.description || 'Could not fetch order');

    const notes = order.notes || {};
    const days = Number(notes.days);
    const orderCampaignId = notes.campaign_id;
    const expectedAmount = FEATURE_FEES_PAISE[days];

    if (notes.type !== 'feature' || !orderCampaignId || !expectedAmount) {
      return json({ error: 'Invalid plan on order' }, 400);
    }
    if (campaign_id && campaign_id !== orderCampaignId) {
      return json({ error: 'Payment does not belong to this campaign' }, 400);
    }
    if (Number(order.amount) !== expectedAmount) {
      return json({ error: 'Payment amount does not match selected plan' }, 400);
    }

    // 3. Flip the campaign to featured (service role, with ownership check).
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: campaign, error: campaignError } = await adminClient
      .from('campaigns')
      .select('id, creator_id')
      .eq('id', orderCampaignId)
      .eq('creator_id', user.id)
      .single();
    if (campaignError || !campaign) {
      return json({ error: 'Campaign not found' }, 404);
    }

    const { data: existingPayment } = await adminClient
      .from('feature_payments')
      .select('campaign_id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();
    if (existingPayment) {
      if (existingPayment.campaign_id !== orderCampaignId) {
        return json({ error: 'Payment has already been used' }, 400);
      }
      return json({ success: true, already_applied: true });
    }

    const { error: paymentError } = await adminClient.from('feature_payments').insert({
      campaign_id: orderCampaignId,
      creator_id: user.id,
      razorpay_order_id,
      razorpay_payment_id,
      amount_paise: expectedAmount,
      days,
    });
    if (paymentError) {
      if (paymentError.code === '23505') {
        return json({ error: 'Payment has already been used' }, 400);
      }
      throw paymentError;
    }

    const now = new Date();
    const featuredUntil = new Date(now);
    featuredUntil.setDate(featuredUntil.getDate() + days);

    const { error } = await adminClient
      .from('campaigns')
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
        featured_since: now.toISOString(),
      })
      .eq('id', orderCampaignId)
      .eq('creator_id', user.id); // ownership check
    if (error) throw error;

    return json({ success: true });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
