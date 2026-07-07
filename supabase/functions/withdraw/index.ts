import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimum a creator can withdraw, in rupees.
// Fee passed on to the creator, in basis points. 0 = Raise charges nothing and
// absorbs Razorpay's processing cost from platform revenue (tips + featuring).
// Set > 0 to pass the processing cost through to the creator instead.
const WITHDRAWAL_FEE_BPS = 0;

// Creator-initiated, all-or-nothing payout of a campaign's raised funds via
// RazorpayX. Closes the campaign on success.
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

    const { campaign_id } = await req.json();
    if (!campaign_id) return json({ error: 'Missing campaign_id' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Load the campaign (ownership-checked) and the creator's payout account.
    const { data: campaign } = await admin
      .from('campaigns')
      .select('id, creator_id, status')
      .eq('id', campaign_id)
      .eq('creator_id', user.id)
      .single();
    if (!campaign) return json({ error: 'Campaign not found' }, 404);

    if (campaign.status === 'withdrawn' || campaign.status === 'refunded') {
      return json({ error: 'This campaign has already been settled.' }, 400);
    }
    if (campaign.status === 'withdrawal_pending') {
      return json({ error: 'A withdrawal for this campaign is already in progress.' }, 400);
    }
    if (campaign.status !== 'completed') {
      return json({ error: 'This campaign is not ready to withdraw yet.' }, 400);
    }

    const { data: verifiedDonations, error: donationError } = await admin
      .from('donations')
      .select('amount')
      .eq('campaign_id', campaign_id)
      .eq('status', 'captured')
      .not('razorpay_payment_id', 'is', null);
    if (donationError) throw donationError;

    const gross = (verifiedDonations ?? []).reduce((sum, donation) => (
      sum + Number(donation.amount || 0)
    ), 0);
    if (gross <= 0) {
      return json({ error: 'This campaign has no funds to withdraw.' }, 400);
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('razorpay_fund_account_id, payout_account_ready_at')
      .eq('id', user.id)
      .single();
    if (!profile?.razorpay_fund_account_id) {
      return json({ error: 'Set up your payout account first.', needs_payout_account: true }, 400);
    }
    if (
      profile.payout_account_ready_at &&
      new Date(profile.payout_account_ready_at).getTime() > Date.now()
    ) {
      return json({
        error: 'This payout account is still in the security cooling-off period.',
        payout_account_ready_at: profile.payout_account_ready_at,
      }, 400);
    }

    // Don't re-pay a campaign with an in-flight or completed withdrawal.
    const { data: existing } = await admin
      .from('withdrawals')
      .select('id, status')
      .eq('campaign_id', campaign_id)
      .maybeSingle();
    if (existing && ['queued', 'processing', 'processed'].includes(existing.status)) {
      return json({ error: 'A withdrawal for this campaign is already in progress.' }, 400);
    }

    const fee = Math.floor((gross * WITHDRAWAL_FEE_BPS) / 10000);
    const net = gross - fee;

    // Fire the RazorpayX payout. The idempotency key (campaign_id) prevents a
    // double-click from paying twice.
    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const payoutRes = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
        'Content-Type': 'application/json',
        'X-Payout-Idempotency': campaign_id,
      },
      body: JSON.stringify({
        account_number: Deno.env.get('RAZORPAYX_ACCOUNT_NUMBER')!,
        fund_account_id: profile.razorpay_fund_account_id,
        amount: Math.round(net * 100), // paise
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: `wd_${String(campaign_id).slice(0, 12)}`,
        narration: 'Raise campaign payout',
        notes: { campaign_id },
      }),
    });
    const payout = await payoutRes.json();
    if (!payoutRes.ok) {
      throw new Error(payout.error?.description || 'Payout failed');
    }

    // Record the withdrawal. Only close the campaign after RazorpayX confirms a
    // processed payout; queued/processing payouts remain visibly pending.
    const withdrawalStatus = payout.status === 'processed' ? 'processed' : 'processing';
    const campaignStatus = payout.status === 'processed' ? 'withdrawn' : 'withdrawal_pending';
    const withdrawnAt = payout.status === 'processed' ? new Date().toISOString() : null;
    await admin.from('withdrawals').upsert(
      {
        campaign_id,
        creator_id: user.id,
        gross_amount: gross,
        fee_amount: fee,
        net_amount: net,
        razorpay_payout_id: payout.id,
        status: withdrawalStatus,
        processed_at: withdrawnAt,
      },
      { onConflict: 'campaign_id' }
    );
    await admin
      .from('campaigns')
      .update({ status: campaignStatus, withdrawn_at: withdrawnAt })
      .eq('id', campaign_id)
      .eq('creator_id', user.id);

    return json({
      success: true,
      net_amount: net,
      fee_amount: fee,
      payout_id: payout.id,
      payout_status: payout.status,
      campaign_status: campaignStatus,
    });
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
