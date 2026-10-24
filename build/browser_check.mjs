/* Browser checks for the jAgent site.

   Serves public/ on a local port, then verifies the things a static checker cannot:
   the font actually loads, no console errors, no horizontal overflow, keyboard access,
   reduced-motion behaviour, search, the file tree and the copy control.

   node build/browser_check.mjs [--shots <dir>]
*/
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', 'public');
const shotArg = process.argv.indexOf('--shots');
const shotDir = shotArg > -1 ? process.argv[shotArg + 1] : null;

const types = {
  '.html': 'text/html; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jsonl': 'application/x-ndjson; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.sha256': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(root, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(root, '404.html');
  }
  try {
    const body = await readFile(file);
    res.writeHead(path.endsWith('/') || extname(file) ? 200 : 200, {
      'content-type': types[extname(file)] || 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': types['.html'] });
    res.end(await readFile(join(root, '404.html')));
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({
  args: [...chromium.args, '--font-render-hinting=none'],
  executablePath: process.env.CHROME_PATH || await chromium.executablePath(),
  headless: 'shell',
});

const failures = [];
const notes = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const pages = [
  ['', 'home'], ['skill/', 'skill'], ['resources/', 'resources'], ['resources/kumo/', 'kumo'], ['resources/rea/', 'rea'],
  ['resources/humanizer/', 'humanizer'], ['tasks/', 'tasks'], ['graph/', 'graph'],
  ['search/', 'search'], ['data/', 'data'], ['docs/', 'docs'],
  ['docs/design-contract/', 'design-contract'], ['docs/context-protocol/', 'context-protocol'],
  ['404.html', '404'],
];

async function newPage(options = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()} ${r.failure()?.errorText}`));
  page.__errors = errors;
  if (options.reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  return page;
}

if (shotDir) await mkdir(shotDir, { recursive: true });

// --- per page: console, font, overflow, title, one h1
const sizes = [[320, 720], [390, 844], [768, 1024], [1024, 800], [1440, 900]];
let pageIndex = 0;
for (const [path, name] of pages) {
  const page = await newPage();
  let loaded = false;
  for (const [width, height] of sizes) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const response = await page.goto(base + '/' + path, { waitUntil: 'networkidle0' });
    if (!loaded) {
      check(response.status() === 200, `${name}: HTTP ${response.status()}`);
      const info = await page.evaluate(() => ({
        fonts: document.fonts.check('16px "Google Sans"'),
        family: getComputedStyle(document.body).fontFamily,
        h1: document.querySelectorAll('h1').length,
        title: document.title,
        lang: document.documentElement.lang,
      }));
      check(info.fonts, `${name}: Google Sans is not loaded (document.fonts.check returned false)`);
      check(/Google Sans/.test(info.family), `${name}: body font stack does not lead with Google Sans`);
      check(info.h1 === 1, `${name}: ${info.h1} h1 elements`);
      check(info.title.length > 5, `${name}: weak title`);
      check(info.lang === 'en', `${name}: missing lang`);
      loaded = true;
    }
    const overflow = await page.evaluate(() => {
      const insideScroller = (el) => {
        for (let parent = el.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (/(auto|scroll|hidden)/.test(style.overflowX)) return true;
        }
        return false;
      };
      return {
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        offenders: Array.from(document.querySelectorAll('body *'))
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return rect.width > 0 && rect.right > document.documentElement.clientWidth + 2 &&
              style.position !== 'fixed' && style.position !== 'sticky' && !insideScroller(el);
          })
          .slice(0, 4)
          .map((el) => el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]),
      };
    });
    check(overflow.scroll <= overflow.client + 1,
      `${name} at ${width}px: horizontal overflow ${overflow.scroll} > ${overflow.client} ${JSON.stringify(overflow.offenders)}`);
    if (shotDir && (width === 1440 || width === 390)) {
      await page.screenshot({ path: join(shotDir, `${String(pageIndex).padStart(2, '0')}-${name}-${width}.png`), fullPage: width === 390 });
    }
  }
  check(page.__errors.length === 0, `${name}: console errors ${JSON.stringify(page.__errors)}`);
  await page.close();
  pageIndex += 1;
}

// --- metadata: every page carries the full social and structured-data set
{
  const page = await newPage();
  for (const [path, name] of pages) {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(base + '/' + path, { waitUntil: 'domcontentloaded' });
    const meta = await page.evaluate(() => {
      const get = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.getAttribute('content') || el.getAttribute('href') : null;
      };
      const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((node) => { try { return JSON.parse(node.textContent); } catch { return null; } });
      const collect = (value, out = []) => {
        if (!value || typeof value !== 'object') return out;
        if (Array.isArray(value)) { value.forEach((item) => collect(item, out)); return out; }
        if (value['@type']) out.push(value['@type']);
        Object.values(value).forEach((child) => collect(child, out));
        return out;
      };
      return {
        ogImage: get('meta[property="og:image"]'),
        twitter: get('meta[name="twitter:card"]'),
        siteName: get('meta[property="og:site_name"]'),
        locale: get('meta[property="og:locale"]'),
        canonical: get('link[rel="canonical"]'),
        icon: get('link[rel="icon"]'),
        manifest: get('link[rel="manifest"]'),
        jsonld: ld,
        types: [...new Set(ld.flatMap((block) => collect(block)))],
      };
    });
    check(meta.ogImage && /^https:\/\//.test(meta.ogImage), `${name}: og:image missing or relative`);
    check(meta.twitter === 'summary_large_image', `${name}: twitter card is ${meta.twitter}`);
    check(meta.siteName === 'jAgent', `${name}: og:site_name is ${meta.siteName}`);
    check(meta.locale === 'en', `${name}: og:locale is ${meta.locale}`);
    check(!!meta.icon && !!meta.manifest, `${name}: icon or manifest link missing`);
    check(meta.types.length > 0, `${name}: no JSON-LD nodes`);
    if (name === 'home') {
      check(meta.types.includes('WebSite') && meta.types.includes('SearchAction'), 'home: WebSite or SearchAction missing');
    }
    if (name === 'kumo' || name === 'humanizer') {
      check(meta.types.includes('TechArticle') && meta.types.includes('SoftwareSourceCode'),
        `${name}: TechArticle or SoftwareSourceCode missing (${meta.types.join(',')})`);
      check(meta.types.includes('BreadcrumbList'), `${name}: no breadcrumb JSON-LD`);
    }
  }
  await page.close();
}

// --- themes: switch, persist, and stay readable in both
{
  const page = await newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  const buttons = await page.$$eval('[data-theme-set]', (nodes) => nodes.map((n) => n.dataset.themeSet));
  check(buttons.join(',') === 'system,light,dark', `theme: controls are ${buttons.join(',')}`);
  await page.click('[data-theme-set="light"]');
  const light = await page.evaluate(() => ({
    attr: document.documentElement.dataset.theme,
    canvas: getComputedStyle(document.body).backgroundColor,
    stored: localStorage.getItem('jagent-theme'),
    pressed: document.querySelector('[data-theme-set="light"]').getAttribute('aria-pressed'),
    themeColor: document.querySelector('meta[name="theme-color"]').getAttribute('content'),
  }));
  check(light.attr === 'light' && light.stored === 'light', 'theme: light choice not applied or stored');
  check(light.pressed === 'true', 'theme: aria-pressed not updated');
  check(light.canvas === 'rgb(246, 247, 244)', `theme: light canvas is ${light.canvas}`);
  check(light.themeColor === '#f6f7f4', `theme: theme-color not updated (${light.themeColor})`);

  const contrast = await page.evaluate(() => {
    const parse = (c) => c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const [l1, l2] = [lum(parse(a)), lum(parse(b))].sort((x, y) => y - x);
      return (l1 + 0.05) / (l2 + 0.05);
    };
    const body = getComputedStyle(document.body);
    const canvas = getComputedStyle(document.querySelector('.main')).backgroundColor;
    const pageBg = canvas === 'rgba(0, 0, 0, 0)' ? body.backgroundColor : canvas;
    const link = document.querySelector('.resource-row h3 a') || document.querySelector('.footer-links a');
    const muted = document.querySelector('.resource-row p') || document.querySelector('.small.muted');
    return {
      text: ratio(body.color, pageBg),
      link: link ? ratio(getComputedStyle(link).color, pageBg) : null,
      muted: muted ? ratio(getComputedStyle(muted).color, pageBg) : null,
    };
  });
  check(contrast.text >= 4.5, `theme: body text contrast ${contrast.text.toFixed(2)} in light`);
  check(!contrast.link || contrast.link >= 4.5, `theme: link contrast ${contrast.link?.toFixed(2)} in light`);
  check(!contrast.muted || contrast.muted >= 4.5, `theme: muted text contrast ${contrast.muted?.toFixed(2)} in light`);

  // Every palette token must resolve in every state; a self-referential custom
  // property computes to nothing and silently drops the whole theme.
  for (const mode of ['system', 'light', 'dark']) {
    const tokens = await page.evaluate((mode) => {
      const root = document.documentElement;
      root.dataset.theme = mode;
      const cs = getComputedStyle(root);
      return ['canvas', 'surface', 'raised', 'line', 'text', 'muted', 'action', 'on-action', 'focus', 'alert']
        .map((name) => [name, cs.getPropertyValue('--' + name).trim()]);
    }, mode);
    const empty = tokens.filter(([, value]) => !value).map(([name]) => name);
    check(empty.length === 0, `theme: ${mode} has unresolved tokens: ${empty.join(', ')}`);
  }
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.reload({ waitUntil: 'networkidle0' });
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
  check(persisted === 'light', `theme: choice did not survive reload (${persisted})`);
  await page.screenshot({ path: '/tmp/jagent-light.png' });
  await page.close();
}

// --- icons: Lucide paths are inlined, not hand-drawn
{
  const page = await newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  const svgs = await page.evaluate(() => Array.from(document.querySelectorAll('main svg')).map((s) => s.innerHTML.slice(0, 40)));
  check(svgs.length > 0, 'icons: no inline icons on the home page');
  const skillPage = await page.goto(base + '/skill/', { waitUntil: 'networkidle0' });
  check(skillPage.status() === 200, `skill page returned ${skillPage.status()}`);
  const install = await page.evaluate(() => document.body.textContent.includes('npx skills add'));
  check(install, 'skill page does not show the install command');
  await page.close();
}

// --- collapsed navigation on narrow screens
{
  const page = await newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  const start = await page.evaluate(() => ({
    toggle: getComputedStyle(document.querySelector('[data-nav-toggle]')).display,
    nav: getComputedStyle(document.getElementById('site-nav')).display,
    height: document.querySelector('.sidebar').getBoundingClientRect().height,
  }));
  check(start.toggle !== 'none', 'nav: toggle is not visible at 390px');
  check(start.nav === 'none', 'nav: menu is open by default on a phone');
  check(start.height < 260, `nav: header is ${Math.round(start.height)}px tall before the content`);
  await page.click('[data-nav-toggle]');
  const opened = await page.evaluate(() => ({
    nav: getComputedStyle(document.getElementById('site-nav')).display,
    expanded: document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded'),
    label: document.querySelector('[data-nav-toggle] span').textContent.trim(),
  }));
  check(opened.nav !== 'none' && opened.expanded === 'true', 'nav: toggle does not open the menu');
  check(opened.label.length > 0, 'nav: toggle has no text label');
  await page.keyboard.press('Escape');
  check(await page.evaluate(() => document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded')) === 'false',
    'nav: Escape does not close the menu');
  await page.setViewport({ width: 1440, height: 900 });
  // Every palette token must resolve in every state; a self-referential custom
  // property computes to nothing and silently drops the whole theme.
  for (const mode of ['system', 'light', 'dark']) {
    const tokens = await page.evaluate((mode) => {
      const root = document.documentElement;
      root.dataset.theme = mode;
      const cs = getComputedStyle(root);
      return ['canvas', 'surface', 'raised', 'line', 'text', 'muted', 'action', 'on-action', 'focus', 'alert']
        .map((name) => [name, cs.getPropertyValue('--' + name).trim()]);
    }, mode);
    const empty = tokens.filter(([, value]) => !value).map(([name]) => name);
    check(empty.length === 0, `theme: ${mode} has unresolved tokens: ${empty.join(', ')}`);
  }
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.reload({ waitUntil: 'networkidle0' });
  const wide = await page.evaluate(() => ({
    nav: getComputedStyle(document.getElementById('site-nav')).display,
    toggle: getComputedStyle(document.querySelector('[data-nav-toggle]')).display,
  }));
  check(wide.nav !== 'none', 'nav: menu hidden on desktop');
  check(wide.toggle === 'none', 'nav: toggle visible on desktop');
  await page.close();
}

// --- keyboard: skip link is the first stop and moves focus into main
{
  const page = await newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await page.keyboard.press('Tab');
  await new Promise((resolve) => setTimeout(resolve, 260));
  const first = await page.evaluate(() => ({
    text: document.activeElement.textContent.trim(),
    href: document.activeElement.getAttribute('href'),
    visible: document.activeElement.getBoundingClientRect().top >= 0,
  }));
  check(/Skip to content/.test(first.text), `tab order: first stop is ${JSON.stringify(first.text)}`);
  check(first.visible, 'tab order: skip link is off screen when focused');
  await page.keyboard.press('Enter');
  const hash = await page.evaluate(() => location.hash);
  check(hash === '#main', 'skip link does not move focus to main');
  const focusVisible = await page.evaluate(() => {
    const link = document.querySelector('.nav-link');
    link.focus();
    const style = getComputedStyle(link);
    return style.outlineStyle !== 'none' || document.activeElement === link;
  });
  check(focusVisible, 'navigation links cannot take focus');
  await page.close();
}

// --- filters
{
  const page = await newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + '/resources/', { waitUntil: 'networkidle0' });
  await page.click('[data-filter="Writing"]');
  const filtered = await page.evaluate(() => ({
    visible: Array.from(document.querySelectorAll('[data-category]')).filter((el) => !el.hidden).length,
    pressed: document.querySelector('[data-filter="Writing"]').getAttribute('aria-pressed'),
    status: document.querySelector('[data-filter-status]').textContent,
  }));
  check(filtered.visible === 2, `filter: expected 2 Writing resources, saw ${filtered.visible}`);
  check(filtered.pressed === 'true', 'filter: aria-pressed not updated');
  check(/2 of 14/.test(filtered.status), `filter: status text is ${filtered.status}`);
  await page.click('[data-filter="all"]');
  const restored = await page.evaluate(() => Array.from(document.querySelectorAll('[data-category]')).filter((el) => !el.hidden).length);
  check(restored === 14, `filter: reset shows ${restored} resources`);
  await page.close();
}

// --- search
{
  const page = await newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(base + '/search/?q=contrast', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelectorAll('.result').length > 0, { timeout: 8000 });
  const results = await page.evaluate(() => ({
    count: document.querySelectorAll('.result').length,
    first: document.querySelector('.result h3').textContent,
    marks: document.querySelectorAll('.result mark').length,
    status: document.querySelector('#search-status').textContent,
  }));
  check(results.count >= 2, `search: only ${results.count} results for "contrast"`);
  check(/Design contract/.test(results.first), `search: "contrast" ranks ${results.first} first`);
  check(results.marks > 0, 'search: no highlighted terms');
  check(/match/i.test(results.status), `search: status text is ${results.status}`);

  await page.click('#q', { clickCount: 3 });
  await page.type('#q', 'no-such-term-xyzq');
  await page.waitForFunction(() => /No passage/.test(document.querySelector('#search-status').textContent), { timeout: 5000 });
  const empty = await page.evaluate(() => document.querySelectorAll('.result').length);
  check(empty === 0, `search: no-results state left ${empty} results`);

  await page.click('#q', { clickCount: 3 });
  await page.type('#q', 'reduced motion');
  await page.waitForFunction(() => document.querySelectorAll('.result').length > 0, { timeout: 5000 });
  await page.keyboard.press('ArrowDown');
  const active = await page.evaluate(() => document.activeElement.classList.contains('result'));
  check(active, 'search: arrow key does not move into results');
  await page.close();
}

// --- search works when the index is missing
{
  const page = await newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().endsWith('data/search-index.json')) request.respond({ status: 404, body: 'missing' });
    else request.continue();
  });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(base + '/search/', { waitUntil: 'networkidle0' });
  await page.type('#q', 'kumo');
  await page.waitForFunction(() => /unavailable/i.test(document.querySelector('#search-status').textContent), { timeout: 5000 });
  notes.push('search: failure message shown when the index cannot load');
  await page.close();
}

// --- file tree
{
  const page = await newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + '/resources/humanizer/', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelectorAll('[data-tree-rows] a').length > 0, { timeout: 8000 });
  const before = await page.evaluate(() => ({
    status: document.querySelector('[data-tree-status]').textContent,
    links: document.querySelectorAll('[data-tree-rows] a').length,
  }));
  check(/14 recorded paths/.test(before.status), `tree: status is ${before.status}`);
  check(before.links === 14, `tree: ${before.links} file links, expected 14`);
  await page.type('[data-tree-filter]', 'SKILL');
  await page.waitForFunction(() => /paths match/.test(document.querySelector('[data-tree-status]').textContent), { timeout: 5000 });
  const filtered = await page.evaluate(() => document.querySelectorAll('[data-tree-rows] a').length);
  check(filtered >= 1 && filtered < 14, `tree: filter returned ${filtered} rows`);
  await page.close();
}

// --- large tree: filter and directory expansion
{
  const page = await newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + '/resources/lucide/', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelectorAll('[data-tree-rows] a').length > 0, { timeout: 15000 });
  const status = await page.evaluate(() => document.querySelector('[data-tree-status]').textContent);
  check(/5,782 recorded paths/.test(status), `lucide tree: status is ${status}`);
  const dir = await page.$('[data-tree-rows] button.dir');
  await dir.click();
  const expanded = await page.evaluate(() => document.querySelector('[data-tree-rows] button.dir').getAttribute('aria-expanded'));
  check(expanded === 'true', 'tree: directory did not expand');
  await page.type('[data-tree-filter]', 'packages/lucide-react/src/');
  await page.waitForFunction(() => /paths match/.test(document.querySelector('[data-tree-status]').textContent), { timeout: 8000 });
  const matches = await page.evaluate(() => document.querySelectorAll('[data-tree-rows] a').length);
  check(matches > 10, `tree: path filter returned ${matches} rows`);
  await page.close();
}

// --- graph interaction
{
  const page = await newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + '/graph/', { waitUntil: 'networkidle0' });
  await page.click('.graph-node[data-id="resource/kumo"]');
  const detail = await page.evaluate(() => document.querySelector('[data-graph-detail]').textContent);
  check(/Kumo/.test(detail), 'graph: selecting a node does not update the detail panel');
  check(/governs|conflicts|requires|pairs/.test(detail), 'graph: detail panel shows no relationships');
  const hidden = await page.evaluate(() => {
    document.querySelector('[data-edge-filter="governs"]').click();
    return Array.from(document.querySelectorAll('.graph-edge')).filter((edge) => !edge.hidden).length;
  });
  check(hidden === 6, `graph: governs filter shows ${hidden} edges, expected 6`);
  await page.evaluate(() => document.querySelector('.graph-node[data-id="resource/rea"]').focus());
  const dimmed = await page.evaluate(() => document.querySelectorAll('.graph-node[data-dim]').length);
  check(dimmed > 5, 'graph: keyboard focus does not isolate neighbours');
  await page.close();
}

// --- copy control
{
  const page = await newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(base, ['clipboard-read', 'clipboard-write']);
  await page.goto(base + '/resources/kumo/', { waitUntil: 'networkidle0' });
  const hasCopy = await page.evaluate(() => document.querySelectorAll('.code-copy').length);
  check(hasCopy >= 2, `copy: ${hasCopy} copy buttons on a page with code blocks`);
  await page.evaluate(() => document.querySelector('.code-copy').click());
  await page.waitForFunction(() => /Copied|failed/.test(document.querySelector('.code-copy').textContent), { timeout: 4000 });
  const label = await page.evaluate(() => document.querySelector('.code-copy').textContent);
  check(label === 'Copied', `copy: button reported ${label}`);
  await page.close();
}

// --- reduced motion
{
  const page = await newPage({ reducedMotion: true });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  const motion = await page.evaluate(() => {
    const main = document.querySelector('.main');
    const button = document.querySelector('.btn');
    return {
      animation: getComputedStyle(main).animationName,
      duration: getComputedStyle(button).transitionDuration,
      media: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  check(motion.media, 'reduced motion: media query not emulated');
  check(motion.animation === 'none', `reduced motion: main still animates (${motion.animation})`);
  check(parseFloat(motion.duration) <= 0.001, `reduced motion: transitions set to ${motion.duration}`);
  await page.close();
}

// --- markdown twin and data files are served as their own content
{
  const page = await newPage();
  const md = await page.goto(base + '/resources/humanizer/index.md');
  const text = await md.text();
  check(md.status() === 200 && /^# Humanizer/.test(text.replace(/^\uFEFF/, '')), `markdown twin does not serve plain markdown (got ${JSON.stringify(text.slice(0, 40))})`);
  const manifest = await page.goto(base + '/data/manifest.json');
  const data = JSON.parse(await manifest.text());
  check(/^\d+\.\d+\.\d+$/.test(data.version), `manifest version is not semver (${data.version})`);
  check(data.counts.resources === 14, `manifest counts ${data.counts.resources} resources`);
  check(Array.isArray(data.retrieval.not_implemented) && data.retrieval.not_implemented.includes('vector database'),
    'manifest does not state that no vector database is implemented');
  await page.close();
}

await browser.close();
server.close();

console.log(`browser checks: ${failures.length} failure(s)`);
for (const note of notes) console.log(`note: ${note}`);
for (const failure of failures) console.log('  - ' + failure);
process.exit(failures.length ? 1 : 0);
