import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_DAYS = [7, 30, 90];

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

    const days = Number(order.notes?.days);
    if (!ALLOWED_DAYS.includes(days)) {
      return json({ error: 'Invalid plan on order' }, 400);
    }

    // 3. Flip the campaign to featured (service role, with ownership check).
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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
      .eq('id', campaign_id)
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
