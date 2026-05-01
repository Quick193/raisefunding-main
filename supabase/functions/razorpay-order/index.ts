import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { amount, campaign_id } = await req.json();
    if (!amount || !campaign_id) {
      return new Response(JSON.stringify({ error: 'Missing amount or campaign_id' }), { status: 400 });
    }

    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,                 // in paise
        currency: 'INR',
        receipt: `feat_${campaign_id.slice(0, 8)}_${Date.now()}`,
      }),
    });

    const order = await response.json();
    if (!response.ok) throw new Error(order.error?.description || 'Razorpay order creation failed');

    return new Response(JSON.stringify(order), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
