// Pushes theme/ to the unpublished staging theme defined by SHOPIFY_STAGING_THEME_ID.
// Guard rails: refuses to run without an explicit ID and aborts if that theme is live.
// Publishing to production is a manual, human-approved step in the Shopify admin.
import { spawnSync } from 'node:child_process';

const themeId = process.env.SHOPIFY_STAGING_THEME_ID?.trim();
if (!themeId) {
  console.error('SHOPIFY_STAGING_THEME_ID is not set. Create an unpublished theme and set its ID in .env.');
  process.exit(1);
}

const list = spawnSync('shopify', ['theme', 'list', '--json'], { encoding: 'utf8' });
if (list.status !== 0) {
  console.error(list.stderr || 'Could not list themes. Are you logged in?');
  process.exit(1);
}

let themes;
try {
  themes = JSON.parse(list.stdout);
} catch {
  console.error('Unexpected output from `shopify theme list --json`:\n' + list.stdout);
  process.exit(1);
}

const target = themes.find((theme) => String(theme.id) === themeId);
if (!target) {
  console.error(`Theme ${themeId} not found in the store.`);
  process.exit(1);
}
if (target.role === 'live' || target.role === 'main') {
  console.error(`ABORTED: theme ${themeId} ("${target.name}") is the LIVE theme. Never push to production from here.`);
  process.exit(1);
}

console.log(`Pushing theme/ to "${target.name}" (${themeId}, role: ${target.role})...`);
// --nodelete keeps files that exist only remotely (e.g. editor-created templates).
const push = spawnSync('shopify', ['theme', 'push', '--path', 'theme', '--theme', themeId, '--nodelete'], {
  stdio: 'inherit',
});
process.exit(push.status ?? 1);
