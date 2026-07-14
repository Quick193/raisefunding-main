// Single source of truth for legal/business identity and contact details.
// Update these values in ONE place and every legal page + the footer follow.
//
// Raise is operated by an individual (sole proprietor). Do NOT describe it as a
// private limited company anywhere — the entity shown on the site must match the
// PAN/bank account used for payment-gateway (Razorpay) KYC.
export const LEGAL = {
  operatorName: 'Pallavi Mundadi',
  operatorType: 'sole proprietor',
  brand: 'Raise',
  // Live deployment URL submitted for verification. Switch both of these to
  // 'raise.org.in' / 'https://raise.org.in' once the custom domain is live.
  domain: 'raisefunding.vercel.app',
  url: 'https://raisefunding.vercel.app',
  email: 'raise.org.in@gmail.com',
  phoneDisplay: '+91 99012 49601',
  phoneHref: '+919901249601',
  // Human-readable date shown as "Last updated" on every legal page.
  lastUpdated: '14 July 2026',
} as const;

// "Raise, operated by Pallavi Mundadi (a sole proprietor)" — reusable descriptor.
export const OPERATED_BY = `${LEGAL.brand}, operated by ${LEGAL.operatorName} (a ${LEGAL.operatorType})`;
