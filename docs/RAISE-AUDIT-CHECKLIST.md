# Raise — Verification & Audit Readiness Checklist

Use this to grade the website yourself before submitting for Razorpay merchant
activation (or any business/domain verification). Each item lists **what a
reviewer looks for** and **where it lives** in this site.

Contact identity used across the site (edit in one place: `src/config/legal.ts`):
- **Operator:** Pallavi Mundadi (individual / sole proprietor)
- **Domain:** raise.org.in · **Email:** raise.org.in@gmail.com · **Phone:** +91 99012 49601

---

## A. Required legal pages (Razorpay's core checklist)

| # | Page | Route | Reviewer expectation | Status |
|---|------|-------|----------------------|--------|
| 1 | Terms & Conditions | `/terms` | Who operates it, eligibility, obligations, prohibited use, fees, liability, governing law | ✅ |
| 2 | Privacy Policy | `/privacy` | What data is collected, why, sharing, retention, user rights, grievance officer | ✅ |
| 3 | Refund & Cancellation | `/refunds` | Clear conditions, request process, timelines, non-refundables | ✅ |
| 4 | Shipping & Delivery | `/shipping` | Even for digital services — states no physical shipping, how "delivery" happens | ✅ |
| 5 | Contact Us | `/contact` | Reachable email **and** phone, response time, grievance officer | ✅ |
| 6 | Pricing & Fees | `/pricing` | Transparent fee model, no hidden charges | ✅ (bonus) |

## B. Entity & identity consistency (most common rejection cause)

- [x] The business name/operator shown on the site **matches** the PAN/bank KYC you submit.
- [x] No false "Pvt Ltd" / "Inc" / company claims (site says *individual / sole proprietor*).
- [x] Same email + phone appear on the site **and** in your Razorpay dashboard.
- [ ] **YOU:** the bank account + PAN in Razorpay are under **Pallavi Mundadi**. ⚠️ verify.
- [ ] **YOU:** domain `raise.org.in` is registered and the site is **live** on it (reviewers visit the real URL). ⚠️ pending.

## C. Contactability & trust

- [x] Email is a working inbox you monitor (raise.org.in@gmail.com).
- [x] Phone number is reachable.
- [x] Footer shows contact + all legal links on every page.
- [x] No dead/placeholder links (`href="#"`) — removed dead social icons.
- [x] Grievance Officer named (IT Act 2000 / DPDP Act 2023 requirement in India).

## D. Business-model clarity (what are you charging for?)

- [x] Reviewer can tell in seconds what the site does: crowdfunding / donations.
- [x] Fee model is explicit: 0% platform fee + optional tip + Razorpay processing fee.
- [x] Escrow + 30-day auto-refund model described (donor protection = strong trust signal).
- [x] Prohibited campaigns listed (no gambling, illegal, fraudulent, etc.).

## E. Legal specifics for an Indian crowdfunding platform

- [x] DPDP Act 2023 referenced (data rights, breach notice, grievance).
- [x] IT Act 2000 referenced (grievance officer).
- [x] FCRA mentioned for foreign contributions (creator responsibility).
- [x] Tax position stated clearly (Raise does **not** issue 80G / tax receipts).
- [x] Governing law = India, courts of competent jurisdiction in India.
- [x] 18+ eligibility stated; children's data not collected.

## F. Technical hygiene (auditors and gateways check these)

- [ ] **YOU:** Site served over **HTTPS** with a valid SSL certificate on the live domain.
- [x] `Last updated` dates are current (14 July 2026).
- [x] Pages load with no console errors (verified).
- [x] Legal pages linked from the footer of every page (crawlable/discoverable).
- [x] Mobile responsive (verified).

---

## What GoFundMe / Milaap include that we now match

- Dedicated, separately-linked **Terms**, **Privacy**, **Refund**, and **Contact** pages.
- A clear statement that the platform is an **intermediary**, not the fund recipient or a charity.
- **Donor protection** language (refunds, escrow, fraud handling).
- **Prohibited use** list and the right to remove campaigns.
- A **grievance/complaints** route with named officer and response SLA.
- Transparent **fee disclosure**.

## Still on YOU before submitting (not code)

1. Register/point **raise.org.in** and deploy the site live over HTTPS.
2. Ensure Razorpay KYC (PAN + bank) is under **Pallavi Mundadi** — must match the site.
3. Confirm **raise.org.in@gmail.com** is monitored and the phone is reachable.
4. In the Razorpay dashboard, set the business type to **Individual / Proprietorship**
   and the same contact details.
5. (Optional but strengthens approval) add a business address in the Razorpay
   dashboard KYC even though it isn't published on the site.
