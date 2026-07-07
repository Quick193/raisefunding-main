import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const legacyPublicDonationSelect = 'CREATE POLICY "Anyone can view ' + 'donations"';
const legacyPublicDonationInsert = 'CREATE POLICY "Anyone can create ' + 'donations"';
const permissiveCheck = 'WITH CHECK (' + 'true)';
const flattenKeys = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === 'object' && !Array.isArray(child)
    ? flattenKeys(child, path)
    : [path];
});

const checks = [
  {
    name: 'FAQ accordion starts closed',
    pass: () => read('src/components/FAQAccordion.tsx').includes('useState<number | null>(null)'),
  },
  {
    name: 'Home supporter stats use campaign counters',
    pass: () => {
      const home = read('src/pages/Home.tsx');
      return home.includes('supporter_count') && !home.includes(".from('donations')");
    },
  },
  {
    name: 'Bolt starter metadata is removed',
    pass: () => {
      const index = read('index.html');
      return !index.includes('bolt.new') && !index.includes('vite.svg');
    },
  },
  {
    name: 'Featured campaign flow requires verified Razorpay payment',
    pass: () => {
      const modal = read('src/components/FeatureModal.tsx');
      const orderFn = read('supabase/functions/razorpay-order/index.ts');
      const verifyFn = read('supabase/functions/razorpay-verify/index.ts');
      const webhookFn = read('supabase/functions/razorpay-webhook/index.ts');
      const migration = read('supabase/migrations/20260706000001_security_hardening.sql');
      return modal.includes("supabase.functions.invoke('razorpay-order'") &&
        modal.includes("supabase.functions.invoke('razorpay-verify'") &&
        orderFn.includes('FEATURE_FEES_PAISE') &&
        orderFn.includes(".eq('creator_id', user.id)") &&
        orderFn.includes('creator_id: user.id') &&
        verifyFn.includes('feature_payments') &&
        verifyFn.includes('order.notes') &&
        webhookFn.includes('notes.creator_id !== campaign.creator_id') &&
        migration.includes('CREATE TABLE IF NOT EXISTS feature_payments') &&
        migration.includes('protect_campaign_service_columns');
    },
  },
  {
    name: 'Campaign financial state is server-owned',
    pass: () => {
      const migration = read('supabase/migrations/20260706000001_security_hardening.sql');
      const setup = read('supabase/setup.sql');
      const withdrawFn = read('supabase/functions/withdraw/index.ts');
      const stats = read('src/pages/CampaignStats.tsx');
      return migration.includes('NEW.current_amount := OLD.current_amount') &&
        migration.includes('NEW.status := OLD.status') &&
        migration.includes('NEW.is_featured := false') &&
        setup.includes('protect_campaign_service_columns') &&
        !setup.includes(legacyPublicDonationInsert) &&
        setup.includes('GRANT EXECUTE ON FUNCTION record_verified_donation') &&
        setup.includes('DROP TRIGGER IF EXISTS donation_created ON donations') &&
        !setup.includes('CREATE TRIGGER donation_created') &&
        withdrawFn.includes("campaign.status !== 'completed'") &&
        withdrawFn.includes(".from('donations')") &&
        withdrawFn.includes(".eq('status', 'captured')") &&
        stats.includes("campaign.status !== 'completed'");
    },
  },
  {
    name: 'Refund job does not finalize failed refunds',
    pass: () => {
      const refundFn = read('supabase/functions/refund-expired/index.ts');
      return refundFn.includes('campaignHadFailure') &&
        refundFn.includes("refund_status: 'processing'") &&
        refundFn.includes(".or('refund_status.is.null,refund_status.eq.failed')") &&
        refundFn.includes('if (!campaignHadFailure)');
    },
  },
  {
    name: 'Password reset links land on a password update flow',
    pass: () => {
      const app = read('src/App.tsx');
      const forgot = read('src/pages/ForgotPassword.tsx');
      const reset = read('src/pages/ResetPassword.tsx');
      return forgot.includes('/reset-password') &&
        app.includes('path="/reset-password"') &&
        reset.includes('supabase.auth.updateUser({ password })');
    },
  },
  {
    name: 'Public campaign media only loads trusted URLs',
    pass: () => {
      const media = read('src/utils/media.ts');
      const card = read('src/components/CampaignCard.tsx');
      const detail = read('src/pages/CampaignDetail.tsx');
      return media.includes('getTrustedCampaignMediaUrl') &&
        media.includes('/storage/v1/object/public/campaign-media/campaigns/') &&
        card.includes('getTrustedCampaignMediaUrl(campaign.image_url)') &&
        detail.includes('getTrustedCampaignMediaUrl(campaign.image_url)') &&
        read('src/pages/CreateCampaign.tsx').includes('getTrustedCampaignMediaUrl(formData.imageUrl)') &&
        read('src/pages/EditCampaign.tsx').includes('getTrustedCampaignMediaUrl(formData.imageUrl)') &&
        detail.includes('const trustedDirectUrl = getTrustedCampaignMediaUrl(v.url)') &&
        detail.includes('src={trustedDirectUrl}') &&
        detail.includes('referrerPolicy="no-referrer"');
    },
  },
  {
    name: 'Seed and one-off SQL cannot reopen fixed production risks',
    pass: () => {
      const seed = read('supabase/seed_dummy_data.sql');
      const featuredSeed = read('supabase/seed_40_featured_test.sql');
      const featuredMigration = read('supabase/migration_add_featured.sql');
      const featuredSinceMigration = read('supabase/migration_add_featured_since.sql');
      const migrationGuard = read('supabase/migrations/20260618000002_protect_featured_columns.sql');
      return !seed.includes('Donations are publicly viewable') &&
        !seed.includes('FOR SELECT USING (true)') &&
        seed.includes("current_setting('app.allow_test_seed', true)") &&
        featuredSeed.includes("current_setting('app.allow_test_seed', true)") &&
        featuredMigration.includes('BEFORE INSERT OR UPDATE ON campaigns') &&
        featuredMigration.includes('NEW.is_featured := false') &&
        featuredSinceMigration.includes('BEFORE INSERT OR UPDATE ON campaigns') &&
        featuredSinceMigration.includes('NEW.featured_since := NULL') &&
        migrationGuard.includes('BEFORE INSERT OR UPDATE ON campaigns');
    },
  },
  {
    name: 'Deploy build runs production security checks',
    pass: () => {
      const pkg = JSON.parse(read('package.json'));
      const vercel = read('vercel.json');
      return pkg.scripts.build.includes('npm run test') &&
        vercel.includes('"buildCommand": "npm run build"');
    },
  },
  {
    name: 'Campaign media storage is constrained to owned media paths',
    pass: () => {
      const migration = read('supabase/migrations/20260706000001_security_hardening.sql');
      const storage = read('supabase/storage_setup.sql');
      return migration.includes("(storage.foldername(name))[2] = auth.uid()::text") &&
        migration.includes("(storage.foldername(name))[3] IN ('covers', 'gallery', 'videos')") &&
        migration.includes("lower(name) ~ '\\.(jpg|jpeg|png|webp|gif)$'") &&
        migration.includes("lower(name) ~ '\\.(mp4|mov|webm)$'") &&
        storage.includes("(storage.foldername(name))[2] = auth.uid()::text") &&
        storage.includes("lower(name) ~ '\\.(jpg|jpeg|png|webp|gif)$'");
    },
  },
  {
    name: 'Legacy migrations do not reopen donation or profile RLS issues',
    pass: () => {
      const initial = read('supabase/migrations/20251211085914_create_raise_schema.sql');
      const profileFix = read('supabase/migrations/20251228162116_fix_profiles_rls.sql');
      return !initial.includes(legacyPublicDonationSelect) &&
        !initial.includes(legacyPublicDonationInsert) &&
        initial.includes('REVOKE SELECT (email) ON profiles') &&
        profileFix.includes('WITH CHECK (auth.uid() = id)') &&
        !profileFix.includes(permissiveCheck) &&
        profileFix.includes('REVOKE SELECT (email) ON profiles');
    },
  },
  {
    name: 'External share popups cannot retain opener access',
    pass: () => read('src/pages/CampaignDetail.tsx').includes("'noopener,noreferrer'"),
  },
  {
    name: 'Mobile navbar menu is present',
    pass: () => {
      const navbar = read('src/components/Navbar.tsx');
      return navbar.includes('mobileOpen') && navbar.includes('Open navigation menu');
    },
  },
  {
    name: 'Direct donation inserts are disabled until payment verification is implemented',
    pass: () => !read('src/pages/CampaignDetail.tsx').includes(".from('donations').insert"),
  },
  {
    name: 'Campaign reporting is server-mediated and rate limited',
    pass: () => {
      const reports = read('supabase/migrations/20260501000001_create_campaign_reports.sql');
      const hardening = read('supabase/migrations/20260706000001_security_hardening.sql');
      const payoutHardening = read('supabase/migrations/20260707000001_payout_and_abuse_hardening.sql');
      const setup = read('supabase/setup.sql');
      const reportFunction = read('supabase/functions/campaign-report/index.ts');
      const campaignDetail = read('src/pages/CampaignDetail.tsx');
      return reports.includes('CREATE TABLE IF NOT EXISTS campaign_reports') &&
        reports.includes("status = 'open'") &&
        reports.includes('reviewed_at IS NULL') &&
        hardening.includes('DROP POLICY IF EXISTS "Anyone can create campaign reports"') &&
        payoutHardening.includes('DROP POLICY IF EXISTS "Anyone can create campaign reports"') &&
        setup.includes('Public report inserts go through the campaign-report Edge Function') &&
        reportFunction.includes("p_scope: 'campaign_report'") &&
        reportFunction.includes("p_max_requests: 3") &&
        campaignDetail.includes("supabase.functions.invoke('campaign-report'");
    },
  },
  {
    name: 'Locale files expose the same translation keys',
    pass: () => {
      const localeDir = new URL('../src/i18n/locales/', import.meta.url);
      const files = readdirSync(localeDir).filter((file) => file.endsWith('.json')).sort();
      const [baseFile, ...otherFiles] = files;
      const baseKeys = flattenKeys(JSON.parse(read(`src/i18n/locales/${baseFile}`))).sort().join('\n');
      return otherFiles.every((file) => (
        flattenKeys(JSON.parse(read(`src/i18n/locales/${file}`))).sort().join('\n') === baseKeys
      ));
    },
  },
];

let failed = 0;

for (const check of checks) {
  if (check.pass()) {
    console.log(`PASS ${check.name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${check.name}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
}
