// Pulls a READ-ONLY copy of the currently published (live) theme into backups/.
// `theme pull` never modifies the store. backups/ is git-ignored.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dest = `backups/live-${stamp}`;
mkdirSync(dest, { recursive: true });

console.log(`Pulling live theme into ${dest} (read-only operation)...`);
const result = spawnSync('shopify', ['theme', 'pull', '--live', '--path', dest], { stdio: 'inherit' });
process.exit(result.status ?? 1);
