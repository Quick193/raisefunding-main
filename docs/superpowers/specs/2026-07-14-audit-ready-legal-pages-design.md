# Design: Audit-Ready Legal & Business Pages for Raise

**Date:** 2026-07-14
**Goal:** Prepare the Raise crowdfunding website for Razorpay merchant activation (KYC verification) and general business legitimacy review by adding/rewriting the required legal and business pages to a professional, GoFundMe/Milaap-level standard — with truthful entity framing.

## Context & Constraints

- **Operator:** Pallavi Mundadi, operating as an **individual / sole proprietor** under the brand "Raise". NOT a registered private limited company. All prior "Raise Technologies Pvt. Ltd." claims are false and must be removed (they would fail Razorpay KYC, which checks the website against the PAN/bank account holder).
- **Domain:** raise.org.in
- **Public contact:** raise.org.in@gmail.com · +91 99012 49601 · no physical/city address published.
- **Governing law:** India; "courts of competent jurisdiction in India" (no specific city named).
- **Verification target:** Razorpay merchant activation. Required page set: Terms, Privacy, Refund/Cancellation, Shipping/Delivery, Contact Us. Pricing/Fees added for transparency.
- **Real refund mechanics (from `supabase/functions/refund-expired`):** Escrow model — donations held until the creator claims them; if unclaimed within a 30-day window, every donation is automatically refunded and the campaign marked `refunded`. Voluntary tips are platform revenue and retained.
- **Fee model:** 0% platform fee + optional voluntary donor tip + standard Razorpay payment-processing fees per transaction.

## Components

### 1. `src/config/legal.ts` (new)
Single source of truth: `operatorName`, `operatorType`, `brand`, `domain`, `url`, `email`, `phoneDisplay`, `phoneHref`, `lastUpdated`. All legal pages and the footer import from it.

### 2. New pages
- `/refunds` — **Refund & Cancellation Policy**: escrow/30-day auto-refund, discretionary refunds (duplicate, accidental, unauthorized, fraud, technical failure), request process (email within 7 days), timelines (5–7 business days to original method), non-refundable voluntary tips, Razorpay fee note.
- `/shipping` — **Shipping & Delivery Policy**: digital service; no physical goods; donations reflected on the campaign immediately after payment confirmation.
- `/contact` — **Contact Us**: email, phone, response-time expectations, Grievance Officer (IT Act 2000 / DPDP Act 2023), operator identity.
- `/pricing` — **Pricing & Fees**: 0% platform fee, optional tip, Razorpay processing fees, payout/escrow explanation.

### 3. Rewrites
- **Privacy Policy** — sole-proprietor framing; DPDP Act 2023 + IT Act 2000; Grievance Officer; processors (Supabase, Razorpay); retention; breach notification; user rights; children; contact via config.
- **Terms of Service** — sole-proprietor framing; eligibility; creator + donor obligations; escrow/payout mechanics; tips; prohibited campaigns; fees; refunds cross-link; chargebacks; IP; disclaimers; limitation of liability; indemnity; termination; governing law ("courts of competent jurisdiction in India"); force majeure; changes; contact.

### 4. Housekeeping
- `App.tsx`: register 4 new routes.
- `Footer.tsx`: pull contact from config; add new legal links (Refunds, Shipping, Pricing, Contact); fix dead `#` links; **remove dead social icons** (per user).
- Update all "Last updated" dates to 14 July 2026.

### 5. Deliverable
- `docs/RAISE-AUDIT-CHECKLIST.md` — evaluation checklist so the user can grade each page against Razorpay + crowdfunding best practice before submitting.

## Testing / Verification
- `npm run typecheck` passes.
- `npm run build` (runs production-checks) passes.
- Preview: each new route renders; footer links resolve; no `Pvt. Ltd.` / `support@raisefunding.in` / `Mumbai` strings remain in `src/`.

## Out of Scope
- Actual Razorpay dashboard KYC submission (user does this).
- Domain purchase/DNS for raise.org.in.
- Backend/edge-function changes.
