import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Creates a Razorpay order for a donation. Donations pool in the platform's
// account (escrow) and are paid out to the creator on withdrawal. Open to
// anonymous donors, so this endpoint does not require auth.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { campaign_id, amount, tip = 0, donor_name, donor_email } = await req.json();

    if (!campaign_id || !amount || Number(amount) < 1) {
      return json({ error: 'Missing campaign_id or invalid amount' }, 400);
    }
    if (!donor_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(donor_email)) {
      return json({ error: 'A valid donor email is required' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up the campaign. Donations pool in the platform account (escrow
    // model) — they are paid out to the creator on withdrawal, not split here.
    const { data: campaign, error: campErr } = await admin
      .from('campaigns')
      .select('id, current_amount, goal_amount, status, end_date')
      .eq('id', campaign_id)
      .single();
    if (campErr || !campaign) return json({ error: 'Campaign not found' }, 404);

    // Refuse donations to campaigns that are closed or already funded, and cap
    // a donation so it can't push the total past the goal.
    const ended =
      campaign.status === 'completed' ||
      (campaign.end_date &&
        new Date(String(campaign.end_date).split('T')[0] + 'T23:59:59').getTime() <= Date.now());
    if (ended) return json({ error: 'This campaign is closed to new donations.' }, 400);

    const remaining = Number(campaign.goal_amount) - Number(campaign.current_amount);
    if (remaining <= 0) {
      return json({ error: 'This campaign has already reached its goal.' }, 400);
    }
    if (Number(amount) > remaining) {
      return json(
        { error: `Only ₹${remaining.toLocaleString('en-IN')} left to reach the goal.`, remaining },
        400
      );
    }

    const donationPaise = Math.round(Number(amount) * 100);
    const tipPaise = Math.round(Number(tip) * 100);

    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const orderBody: Record<string, unknown> = {
      amount: donationPaise + tipPaise, // total charged to the donor, in paise
      currency: 'INR',
      receipt: `don_${String(campaign_id).slice(0, 8)}_${Date.now()}`,
      // notes ride along on the payment so the webhook can record the donation
      // even if the client never calls back.
      notes: {
        type: 'donation',
        campaign_id,
        donor_name: donor_name || 'Anonymous',
        donor_email,
        donation_amount: String(amount), // rupees that count toward the campaign
      },
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    });

    const order = await response.json();
    if (!response.ok) {
      throw new Error(order.error?.description || 'Razorpay order creation failed');
    }

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
