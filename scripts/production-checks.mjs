import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

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
    name: 'Razorpay public key is documented',
    pass: () => read('.env.example').includes('VITE_RAZORPAY_KEY_ID='),
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
    name: 'Campaign reporting schema is present',
    pass: () => read('supabase/migrations/20260501000001_create_campaign_reports.sql').includes('CREATE TABLE IF NOT EXISTS campaign_reports'),
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
