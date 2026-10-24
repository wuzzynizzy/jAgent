/* Generates the brand assets: logo, favicon set, web manifest and social cards.

   Run once, commit the output, and the site build only reads the files:

     npm install && node tools/make_brand.mjs --chromium

   Social cards come from the same type and palette as the site, so a shared link
   matches the page it opens. Nothing here runs at request time.
*/
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const brandDir = join(root, 'assets', 'brand');
const ogDir = join(root, 'assets', 'og');

const theme = JSON.parse(await readFile(join(root, 'config', 'theme.json'), 'utf8'));
const site = JSON.parse(await readFile(join(root, 'config', 'site.json'), 'utf8'));
const resources = JSON.parse(await readFile(join(root, 'config', 'resources.json'), 'utf8'));
const docs = JSON.parse(await readFile(join(root, 'config', 'docs.json'), 'utf8'));
const registry = JSON.parse(await readFile(join(root, 'sources', 'registry.json'), 'utf8'));
const trees = {};
for (const res of resources) {
  trees[res.id] = JSON.parse(await readFile(join(root, 'sources', 'trees', `${res.id}.json`), 'utf8'));
}
const dark = theme.palettes.dark;

/* The mark: a rounded tile holding a lowercase j, whose stem is a commit line
   and whose hook closes the loop. Two shapes, so it survives a 16px tab. */
const markSvg = (size, rounded = true, withBackground = true) => {
  const rx = rounded ? 15 : 0;
  const bg = withBackground ? `<rect width="64" height="64" rx="${rx}" fill="${dark.canvas}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="jAgent">
  ${bg}
  <g fill="none" stroke="${dark.action}" stroke-width="7" stroke-linecap="round">
    <path d="M42 21v17a10 10 0 0 1-10 10h-1.5a10 10 0 0 1-10-10"/>
  </g>
  <circle cx="42" cy="11.5" r="4.2" fill="${dark.action}"/>
</svg>`;
};

await mkdir(brandDir, { recursive: true });
await mkdir(ogDir, { recursive: true });

await writeFile(join(brandDir, 'logo.svg'), markSvg(512));
await writeFile(join(brandDir, 'favicon.svg'), markSvg(64));
await writeFile(join(brandDir, 'site.webmanifest'), JSON.stringify({
  name: 'jAgent',
  short_name: 'jAgent',
  description: site.description,
  start_url: '../',
  scope: '../',
  display: 'browser',
  background_color: dark.canvas,
  theme_color: dark.canvas,
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
}, null, 1) + '\n');

const browser = await puppeteer.launch({
  args: [...chromium.args, '--font-render-hinting=none'],
  executablePath: await chromium.executablePath(),
  headless: 'shell',
});
const page = await browser.newPage();

// Rasterise the mark at the sizes browsers and phones ask for.
const fontCss = `@font-face{font-family:"Google Sans";src:url("file://${join(root, 'assets', 'fonts', 'google-sans-latin.woff2')}") format("woff2");font-weight:300 700;font-display:block}`;
for (const size of [16, 32, 48, 180, 192, 512]) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(`<html><head><style>html,body{margin:0;background:transparent}${fontCss}</style></head>
    <body>${markSvg(size)}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const name = size === 180 ? 'apple-touch-icon.png' : size === 16 ? 'favicon-16.png' : size === 32 ? 'favicon-32.png' : size === 48 ? 'favicon-48.png' : `icon-${size}.png`;
  await page.screenshot({ path: join(brandDir, name), omitBackground: true });
}

// Social cards.
const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const card = ({ kicker, title, description, meta, mark = true }) => `<!doctype html><html><head><meta charset="utf-8"><style>
${fontCss}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:${dark.canvas};color:${dark.text};
  font-family:"Google Sans",system-ui,sans-serif;display:flex;flex-direction:column;
  justify-content:space-between;padding:72px 80px;position:relative;overflow:hidden}
header{display:flex;align-items:center;gap:18px}
.brand{font-size:30px;font-weight:500;letter-spacing:-0.03em}
.kicker{font-size:20px;color:${dark.muted};margin-left:auto}
main{display:flex;flex-direction:column;gap:22px}
h1{font-size:${title.length > 46 ? 64 : 76}px;line-height:1.05;letter-spacing:-0.04em;font-weight:500;max-width:1000px}
p{font-size:26px;line-height:1.4;color:${dark.muted};max-width:940px}
footer{display:flex;justify-content:space-between;align-items:baseline;font-size:20px;color:${dark.muted};
  border-top:1px solid ${dark.line};padding-top:26px}
.tag{color:${dark.action}}
</style></head><body>
<header>${mark ? markSvg(56) : ''}<span class="brand">jAgent</span><span class="kicker">${esc(kicker)}</span></header>
<main><h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ''}</main>
<footer><span>${esc(meta)}</span><span class="tag">jAgent v${esc(site.version)} · agent skill library</span></footer>
</body></html>`;

const cards = [
  ['default', { kicker: 'Agent skill library', title: site.tagline,
    description: 'Fourteen reviewed skills with recorded source trees, typed relationships and retrieval-ready files.',
    meta: 'Reviewed 24 October 2026' }],
  ['home', { kicker: 'Agent skill library', title: 'Fourteen agent skills, reviewed at the commits they describe',
    description: 'Design, writing, engineering, research and inspection. Each resource read at a pinned commit.',
    meta: '14 resources · 12 task routes' }],
  ['resources', { kicker: 'Resources', title: 'Fourteen reviewed resources',
    description: 'Commands, limits, licences and every recorded upstream path.', meta: 'Commit-pinned' }],
  ['tasks', { kicker: 'Task routes', title: 'Twelve jobs, one lead resource each',
    description: 'Steps, skip conditions and the result to expect.', meta: 'Routes for agents and people' }],
  ['graph', { kicker: 'Knowledge graph', title: 'Typed relationships between resources',
    description: 'Governs, requires, pairs with, alternative to, conflicts with.', meta: '32 nodes · 32 edges' }],
  ['search', { kicker: 'Search', title: 'Lexical search over 124 passages',
    description: 'Runs in the browser against a static index. No vector database.', meta: 'Local and offline' }],
  ['data', { kicker: 'Data files', title: 'Machine-readable everything',
    description: 'Catalog, graph, chunks with source IDs, recorded trees and checksums.', meta: 'JSON and JSONL' }],
  ['docs', { kicker: 'Guides', title: 'The rules behind the library',
    description: 'Design contract, context protocol, retrieval status, provenance, recovery.', meta: 'Six guides' }],
  ['skill', { kicker: 'Skill entry', title: 'One skill that routes the rest',
    description: 'Load two or three references instead of twenty.', meta: site.skill.install }],
];
for (const doc of docs) {
  cards.push([`doc-${doc.id}`, { kicker: 'Guide', title: doc.title, description: doc.summary, meta: 'jAgent guides' }]);
}
for (const res of resources) {
  const source = registry.find((entry) => entry.id === res.id);
  const tree = trees[res.id];
  cards.push([`resource-${res.id}`, {
    kicker: res.category,
    title: res.name,
    description: res.summary,
    meta: `${source.license} · ${tree.file_count.toLocaleString('en')} files · ${source.commit.slice(0, 7)}`,
  }]);
}

const published = await page.goto('about:blank');
void published;
for (const [name, data] of cards) {
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(card(data));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(ogDir, `${name}.png`) });
}

await browser.close();
console.log(`brand assets written to assets/brand, ${cards.length} social cards to assets/og`);
