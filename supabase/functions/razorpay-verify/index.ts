import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    // Verify caller owns the campaign
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, campaign_id, days } = await req.json();

    // Verify Razorpay signature
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign(
      'HMAC', key, encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
    );
    const generated = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');

    if (generated !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Payment signature mismatch' }), { status: 400 });
    }

    // Use service role to bypass RLS and update the campaign
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + Number(days));

    const { error } = await adminClient
      .from('campaigns')
      .update({ is_featured: true, featured_until: featuredUntil.toISOString() })
      .eq('id', campaign_id)
      .eq('creator_id', user.id);   // ownership check

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
