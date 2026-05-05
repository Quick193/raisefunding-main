/**
 * Translation generator using numbered-list batching.
 *
 * Packs all strings into a numbered list, sends ~2000 chars per request,
 * and parses numbers back out. This gives accurate Google Translate quality
 * with very few API calls (no key required).
 *
 * Run: node scripts/translate.mjs
 * Optional Google Cloud API key for higher limits:
 *   GOOGLE_TRANSLATE_API_KEY=your_key node scripts/translate.mjs
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const EN = JSON.parse(
  readFileSync(join(ROOT, 'src/i18n/locales/en.json'), 'utf8')
);

const LANGS = [
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'gu', name: 'Gujarati' },
];

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || '';

// ── Flatten/rebuild helpers ───────────────────────────────────────────────────
function flattenEntries(obj, prefix = []) {
  const entries = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = [...prefix, key];
    if (typeof val === 'string') entries.push({ path, value: val });
    else if (typeof val === 'object' && val !== null)
      entries.push(...flattenEntries(val, path));
  }
  return entries;
}

function setNested(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!cur[path[i]]) cur[path[i]] = {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
}

// ── Strings that should NOT be translated ────────────────────────────────────
const SKIP_RE = /^[₹\d%\/\s\+\-\.,]+$|^https?:\/\//;

// ── Single translation call via Google Cloud Translation API ──────────────────
async function translateWithKey(texts, targetLang) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, source: 'en', target: targetLang, format: 'text' }),
  });
  if (!res.ok) throw new Error(`Cloud API HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data.translations.map((t) => t.translatedText);
}

// ── Numbered-list batch via unofficial endpoint (no key) ──────────────────────
async function translateNumberedBatch(items, targetLang, attempt = 1) {
  // Format as: "1. text\n2. text\n3. text"
  const numbered = items.map((v, i) => `${i + 1}. ${v}`).join('\n');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(numbered)}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (res.status === 429) {
      if (attempt > 5) throw new Error('Persistent rate limit');
      const wait = attempt * 5000;
      process.stdout.write(`  rate limited, waiting ${wait / 1000}s…\r`);
      await new Promise((r) => setTimeout(r, wait));
      return translateNumberedBatch(items, targetLang, attempt + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const full = data[0].map((c) => c[0]).join('').trim();

    // Parse "1. ...\n2. ..." back out
    const lines = full.split('\n');
    const results = new Array(items.length).fill('');

    for (const line of lines) {
      const m = line.match(/^(\d+)\.\s*(.*)/);
      if (m) {
        const idx = parseInt(m[1], 10) - 1;
        if (idx >= 0 && idx < items.length) {
          results[idx] = (results[idx] ? results[idx] + ' ' : '') + m[2].trim();
        }
      }
    }

    // Fill any gaps with original
    return results.map((r, i) => r || items[i]);
  } catch (err) {
    console.warn(`\n  Batch failed → ${targetLang}: ${err.message}`);
    return items; // fallback to English
  }
}

// ── Translate all entries for one language ────────────────────────────────────
async function translateLanguage(langCode, entries) {
  const results = new Array(entries.length);

  // Separate skippable from translatable
  const toTranslate = entries.map((e, i) => ({ i, value: e.value, skip: SKIP_RE.test(e.value) }));

  // Keep original for skipped
  toTranslate.filter((e) => e.skip).forEach((e) => { results[e.i] = e.value; });

  const needsTranslation = toTranslate.filter((e) => !e.skip);

  if (API_KEY) {
    // ── Official Google Cloud API: batch up to 128 at once ──────────────────
    const BATCH = 128;
    for (let i = 0; i < needsTranslation.length; i += BATCH) {
      const chunk = needsTranslation.slice(i, i + BATCH);
      const translated = await translateWithKey(chunk.map((e) => e.value), langCode);
      chunk.forEach((e, idx) => { results[e.i] = translated[idx] || e.value; });
      process.stdout.write(`  ${Math.min(i + BATCH, needsTranslation.length)}/${needsTranslation.length}\r`);
      if (i + BATCH < needsTranslation.length) await new Promise((r) => setTimeout(r, 300));
    }
  } else {
    // ── Unofficial API: numbered list batches of ~20 strings ────────────────
    const BATCH = 20;
    for (let i = 0; i < needsTranslation.length; i += BATCH) {
      const chunk = needsTranslation.slice(i, i + BATCH);
      const translated = await translateNumberedBatch(chunk.map((e) => e.value), langCode);
      chunk.forEach((e, idx) => { results[e.i] = translated[idx] || e.value; });
      process.stdout.write(`  ${Math.min(i + BATCH, needsTranslation.length)}/${needsTranslation.length} strings\r`);
      // 3 second pause between batches to avoid rate limiting
      if (i + BATCH < needsTranslation.length) await new Promise((r) => setTimeout(r, 3000));
    }
  }

  process.stdout.write('\n');
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const entries = flattenEntries(EN);
const needsCount = entries.filter((e) => !SKIP_RE.test(e.value)).length;

if (API_KEY) {
  console.log('Using Google Cloud Translation API (official)\n');
} else {
  console.log('Using Google Translate free endpoint (batched numbered lists)');
  console.log('Tip: set GOOGLE_TRANSLATE_API_KEY=... for faster, unlimited translation\n');
}

console.log(`Total strings: ${entries.length} (${needsCount} to translate)\n`);

for (const { code, name } of LANGS) {
  const outPath = join(ROOT, `src/i18n/locales/${code}.json`);

  // Skip if an existing translation file is already larger than the English source
  // (i.e. it contains real translated content, not English fallback)
  if (existsSync(outPath)) {
    const existing = readFileSync(outPath, 'utf8');
    const existingSize = Buffer.byteLength(existing, 'utf8');
    const enSize = Buffer.byteLength(JSON.stringify(EN, null, 2), 'utf8');
    if (existingSize > enSize * 1.1) {
      console.log(`  ⏭  Skipping ${code}.json — already translated (${existingSize} bytes > ${enSize} bytes)\n`);
      continue;
    }
  }

  console.log(`Translating → ${name} (${code})…`);
  const translated = await translateLanguage(code, entries);

  const output = {};
  entries.forEach(({ path }, idx) => setNested(output, path, translated[idx]));

  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`  ✓ Saved ${code}.json\n`);

  // Pause between languages (only needed for unofficial API)
  if (!API_KEY) await new Promise((r) => setTimeout(r, 5000));
}

console.log('Done! All translations generated.\n');
if (!API_KEY) {
  console.log('To regenerate with better rate limits, get a free Google Cloud API key:');
  console.log('  https://console.cloud.google.com/apis/library/translate.googleapis.com');
  console.log('  (First 500,000 chars/month are free)');
  console.log('  Then run: GOOGLE_TRANSLATE_API_KEY=your_key node scripts/translate.mjs');
}
