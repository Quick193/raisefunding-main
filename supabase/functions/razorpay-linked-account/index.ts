import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Onboards a campaign creator as a Razorpay Route "linked account" so donations
// can be split/transferred to them. Stores the resulting acc_... id on their
// profile. Must be called by the authenticated creator (their own account).
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

    const {
      name,
      email,
      account_number,
      ifsc,
      beneficiary_name,
      business_type = 'individual',
    } = await req.json();

    if (!name || !email || !account_number || !ifsc || !beneficiary_name) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // NOTE: this targets the classic Route "Linked Accounts" API. Field names can
    // differ across Razorpay account API versions — adjust if your account uses
    // the newer v2 onboarding (/v2/accounts + stakeholders + product config).
    const response = await fetch('https://api.razorpay.com/v1/accounts', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        tnc_accepted: true,
        account_details: { business_name: name, business_type },
        bank_account: { ifsc_code: ifsc, beneficiary_name, account_number },
        notes: { profile_id: user.id },
      }),
    });

    const account = await response.json();
    if (!response.ok) {
      throw new Error(account.error?.description || 'Linked account creation failed');
    }

    // Persist the linked account id on the creator's profile (service role).
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { error } = await adminClient
      .from('profiles')
      .update({ razorpay_account_id: account.id })
      .eq('id', user.id);
    if (error) throw error;

    return json({ razorpay_account_id: account.id });
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
