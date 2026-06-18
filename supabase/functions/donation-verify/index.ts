import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Called from the Razorpay Checkout success handler. Verifies the payment
// signature and records the donation. Idempotent on razorpay_payment_id, so the
// webhook backstop recording the same payment is harmless. Open to anon donors.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      campaign_id,
      donor_name,
      donor_email,
      amount,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing payment fields' }, 400);
    }

    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expected = await hmacHex(KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) {
      return json({ error: 'Payment signature mismatch' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await admin.from('donations').upsert(
      {
        campaign_id,
        donor_name: donor_name || 'Anonymous',
        donor_email,
        amount: Number(amount),
        razorpay_order_id,
        razorpay_payment_id,
        status: 'captured',
      },
      { onConflict: 'razorpay_payment_id', ignoreDuplicates: true }
    );
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
