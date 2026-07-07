import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side price list for featuring a campaign, in paise. The client cannot
// influence the amount — it only picks a plan (days), and the fee is looked up
// here. This money goes to the platform (no Route transfer).
const FEATURE_FEES_PAISE: Record<number, number> = {
  7: 50000,   // ₹500
  30: 200000, // ₹2000
  90: 500000, // ₹5000
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { campaign_id, days } = await req.json();
    const amount = FEATURE_FEES_PAISE[Number(days)];
    if (!campaign_id || !amount) {
      return json({ error: 'Missing campaign_id or invalid plan' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: campaign, error: campaignError } = await admin
      .from('campaigns')
      .select('id, creator_id')
      .eq('id', campaign_id)
      .eq('creator_id', user.id)
      .single();
    if (campaignError || !campaign) {
      return json({ error: 'Campaign not found' }, 404);
    }

    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount, // in paise, server-determined
        currency: 'INR',
        receipt: `feat_${String(campaign_id).slice(0, 8)}_${Date.now()}`,
        // The plan is recorded on the order so verify can trust it instead of
        // the client (which could otherwise pay for 7 days and claim 90).
        notes: { type: 'feature', campaign_id: campaign.id, creator_id: user.id, days: String(days) },
      }),
    });

    const order = await response.json();
    if (!response.ok) throw new Error(order.error?.description || 'Razorpay order creation failed');

    return json(order);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
