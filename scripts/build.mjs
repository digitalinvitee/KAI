/**
 * Production build → dist/
 *
 *   npm run build                         → relative URLs, deploy anywhere
 *   SITE_URL=https://you.github.io/kai/ npm run build
 *                                         → also writes absolute canonical,
 *                                           hreflang and og:image URLs
 *
 * Bundles and minifies JS (one classic deferred script per page, so the
 * build also opens straight from the file system) and CSS (with fonts),
 * fingerprints the bundles and copies static assets.
 */
import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/?$/, process.env.SITE_URL ? '/' : '');

const pages = [
  { html: 'index.html', js: 'src/js/main.js', css: 'src/css/main.css', name: 'site' },
  { html: 'demo-dashboard/index.html', js: 'src/js/dashboard.js', css: 'src/css/dashboard.css', name: 'dashboard' },
];

const STATIC = ['assets', '404.html', 'robots.txt', '.nojekyll'];

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'assets', 'build'), { recursive: true });

const bundle = async (entry, name, kind) => {
  const result = await build({
    entryPoints: { [name]: join(root, entry) },
    bundle: true,
    minify: true,
    sourcemap: false,
    format: kind === 'js' ? 'iife' : undefined,
    target: kind === 'js' ? ['es2020'] : ['chrome100', 'safari15', 'firefox100'],
    outdir: join(dist, 'assets', 'build'),
    entryNames: '[name]-[hash]',
    assetNames: '[name]-[hash]',
    loader: { '.woff2': 'file', '.webp': 'file', '.svg': 'file', '.png': 'file' },
    metafile: true,
    logLevel: 'warning',
  });
  const outputs = result.metafile.outputs;
  const output = Object.keys(outputs).find((file) => file.endsWith(`.${kind}`));
  // Remember where fingerprinted fonts went, so <link rel="preload"> points at the same file.
  Object.entries(outputs).forEach(([file, info]) => {
    const source = Object.keys(info.inputs ?? {})[0];
    if (source?.endsWith('.woff2')) fontMap.set(basename(source), join(root, file));
  });
  return join(root, output);
};

const fontMap = new Map();

const sizes = [];
for (const page of pages) {
  const jsFile = await bundle(page.js, page.name, 'js');
  const cssFile = await bundle(page.css, page.name, 'css');
  const htmlPath = join(dist, page.html);
  const toAsset = (file) => relative(dirname(htmlPath), file).split('\\').join('/');

  let html = await readFile(join(root, page.html), 'utf8');
  html = html
    .replace(/<link rel="stylesheet" href="[^"]+" data-build="css">/, `<link rel="stylesheet" href="${toAsset(cssFile)}">`)
    .replace(/<script type="module" src="[^"]+" data-build="js"><\/script>/, `<script defer src="${toAsset(jsFile)}"></script>`)
    .replace(/href="((?:\.\.\/)?assets\/fonts\/([^"]+\.woff2))"/g, (match, path, name) =>
      fontMap.has(name) ? `href="${toAsset(fontMap.get(name))}"` : match);

  if (siteUrl) {
    const pageUrl = new URL(page.html.replace(/index\.html$/, ''), siteUrl).href;
    html = html
      .replace(/(<link rel="alternate" hreflang="(?:en|x-default)" href=")\.\/(" data-site-url>)/g, `$1${pageUrl}$2`)
      .replace(/(<link rel="alternate" hreflang="de" href=")\.\/\?lang=de(" data-site-url>)/, `$1${pageUrl}?lang=de$2`)
      .replace(/(<meta property="og:image" content=")([^"]+)(" data-site-url>)/, (match, start, path, end) => `${start}${new URL(path, pageUrl).href}${end}`)
      .replace('<meta property="og:type"', `<link rel="canonical" href="${pageUrl}">\n  <meta property="og:url" content="${pageUrl}">\n  <meta property="og:type"`);
  }
  html = html.replace(/ data-site-url/g, '');

  await mkdir(dirname(htmlPath), { recursive: true });
  await writeFile(htmlPath, html);
  sizes.push([page.html, basename(jsFile), basename(cssFile)]);
}

for (const entry of STATIC) {
  await cp(join(root, entry), join(dist, entry), { recursive: true }).catch(() => {});
}

const built = await readdir(join(dist, 'assets', 'build'));
console.log('KAI ▸ build complete');
sizes.forEach(([html, js, css]) => console.log(`  ${html.padEnd(28)} ${js}  ${css}`));
console.log(`  ${built.length} fingerprinted files in dist/assets/build${siteUrl ? `, absolute URLs for ${siteUrl}` : ''}`);
