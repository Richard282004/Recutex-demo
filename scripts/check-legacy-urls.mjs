// Checks that every URL of the current store still works on the new site: 200 directly, or a single
// permanent redirect (308/301) to a page that answers 200. Run before launch and after each deploy.
//
//   npm run check:legacy-urls                          # against http://localhost:3000
//   npm run check:legacy-urls -- https://preview.example.com
//
// The URL list lives in data/legacy-urls.txt (taken from the old store's sitemap).
import { readFileSync } from 'node:fs';

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const paths = readFileSync(new URL('../data/legacy-urls.txt', import.meta.url), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

async function check(path) {
  const first = await fetch(base + path, { redirect: 'manual' });
  if (first.status === 200) return { path, ok: true, note: '200' };
  if (![301, 308].includes(first.status)) return { path, ok: false, note: `${first.status}` };

  const target = new URL(first.headers.get('location'), base + path);
  const final = await fetch(target, { redirect: 'manual' });
  const note = `${first.status} → ${target.pathname} (${final.status})`;
  // A chain of redirects wastes crawl budget; the target itself must answer 200.
  return { path, ok: final.status === 200, note };
}

const results = [];
for (let i = 0; i < paths.length; i += 8) {
  results.push(...(await Promise.all(paths.slice(i, i + 8).map(check))));
}

const failed = results.filter((r) => !r.ok);
for (const r of results.filter((r) => r.note !== '200'))
  console.log(`${r.ok ? 'ok ' : 'ERR'} ${r.path}  ${r.note}`);
console.log(`\n${results.length - failed.length}/${results.length} URLs OK against ${base}`);
process.exit(failed.length ? 1 : 0);
