/**
 * Zero-dependency static server for local development.
 *   npm run dev            → serves the project root on http://localhost:5173
 *   npm run preview        → serves the built dist/ folder
 *   PORT=8080 npm run dev  → another port
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const root = resolve(projectRoot, process.argv[2] ?? '.');
const port = Number(process.env.PORT ?? 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const resolveFile = async (urlPath) => {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = normalize(join(root, decoded));
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      if (!decoded.endsWith('/')) return { redirect: `${decoded}/` };
      return { file: join(candidate, 'index.html') };
    }
    return { file: candidate };
  } catch {
    return null;
  }
};

createServer(async (request, response) => {
  const found = await resolveFile(request.url ?? '/');
  if (found?.redirect) {
    response.writeHead(301, { Location: found.redirect });
    response.end();
    return;
  }
  try {
    if (!found) throw new Error('not found');
    const body = await readFile(found.file);
    response.writeHead(200, {
      'Content-Type': TYPES[extname(found.file).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(body);
  } catch {
    const fallback = await readFile(join(root, '404.html')).catch(() => null);
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(fallback ?? 'Not found');
  }
}).listen(port, () => {
  console.log(`KAI ▸ serving ${root} at http://localhost:${port}`);
});
