// Lane B D8: publish Lane A's immutable scientific data alongside the static app.
// Runs after Vite's build; leave /data and /lib untouched.
import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const distData = fileURLToPath(new URL('../dist/data/', import.meta.url));
const sourceEphem = join(repoRoot, 'data', 'ephem');
const sourceDaily = join(repoRoot, 'data', 'daily.json');

if (!existsSync(sourceEphem) || !statSync(sourceEphem).isDirectory()) {
  throw new Error('Missing Lane A ephemeris directory: ' + sourceEphem);
}
if (!existsSync(join(sourceEphem, 'index.json')) || !existsSync(sourceDaily)) {
  throw new Error('Missing Lane A ephem/index.json or daily.json; refusing incomplete deployment');
}
const index = JSON.parse(readFileSync(join(sourceEphem, 'index.json'), 'utf8'));
const daily = JSON.parse(readFileSync(sourceDaily, 'utf8'));
if (!index.sites || Object.keys(index.sites).length !== 10 || !daily.sites) {
  throw new Error('Unexpected data index or daily summary; refusing incomplete deployment');
}

rmSync(distData, { recursive: true, force: true });
mkdirSync(distData, { recursive: true });
cpSync(sourceEphem, join(distData, 'ephem'), { recursive: true, force: true });
copyFileSync(sourceDaily, join(distData, 'daily.json'));

const builtIndex = JSON.parse(readFileSync(join(distData, 'ephem', 'index.json'), 'utf8'));
const builtDaily = JSON.parse(readFileSync(join(distData, 'daily.json'), 'utf8'));
if (Object.keys(builtIndex.sites).length !== 10 || !builtDaily.sites) {
  throw new Error('Copied scientific data failed postbuild verification');
}
console.log('[D8 postbuild] Copied 10 sites of ephemerides and daily.json into dist/data/');
