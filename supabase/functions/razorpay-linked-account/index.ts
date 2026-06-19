import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sets up a creator's payout destination for the escrow model: a RazorpayX
// Contact + Fund Account (bank). The resulting fund_account_id is what the
// withdraw function pays out to. Must be called by the authenticated creator.
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

    const { name, email, contact, account_number, ifsc, beneficiary_name } = await req.json();
    if (!name || !email || !account_number || !ifsc || !beneficiary_name) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const auth = `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`;

    // 1. Create (or reuse) a RazorpayX Contact for the creator.
    const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        contact: contact || undefined,
        type: 'customer',
        reference_id: user.id,
      }),
    });
    const contactJson = await contactRes.json();
    if (!contactRes.ok) {
      throw new Error(contactJson.error?.description || 'Contact creation failed');
    }

    // 2. Create a bank Fund Account under that contact.
    const faRes = await fetch('https://api.razorpay.com/v1/fund_accounts', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: contactJson.id,
        account_type: 'bank_account',
        bank_account: { name: beneficiary_name, ifsc, account_number },
      }),
    });
    const faJson = await faRes.json();
    if (!faRes.ok) {
      throw new Error(faJson.error?.description || 'Fund account creation failed');
    }

    // 3. Persist both ids on the creator's profile (service role).
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { error } = await adminClient
      .from('profiles')
      .update({ razorpay_contact_id: contactJson.id, razorpay_fund_account_id: faJson.id })
      .eq('id', user.id);
    if (error) throw error;

    return json({ razorpay_fund_account_id: faJson.id });
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
