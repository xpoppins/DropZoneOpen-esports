import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Writes client/public/sitemap.xml before the build.
 *
 * The public site is one URL. A sitemap with one entry still earns its place:
 * it is what you hand Google Search Console to trigger the first crawl, and
 * `lastmod` is how you tell Google the page changed after you publish results.
 *
 * Anchors (#standings, #register) are deliberately absent — they are parts of
 * a page, not pages, and listing them makes a sitemap Google distrusts.
 *
 *   node scripts/make-sitemap.mjs
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://dropzoneopen-esports.onrender.com').replace(/\/+$/, '');
const lastmod = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`.replace('www.sitemap.org', 'www.sitemaps.org');

const out = path.join(root, 'client', 'public', 'sitemap.xml');
await fs.writeFile(out, xml, 'utf8');
console.log(`[seo] sitemap.xml → ${SITE_URL}/ (lastmod ${lastmod})`);

// robots.txt carries the sitemap address, so keep the two in step automatically.
const robotsPath = path.join(root, 'client', 'public', 'robots.txt');
const robots = await fs.readFile(robotsPath, 'utf8');
const nextRobots = robots.replace(/^Sitemap: .*$/m, `Sitemap: ${SITE_URL}/sitemap.xml`);
if (nextRobots !== robots) {
  await fs.writeFile(robotsPath, nextRobots, 'utf8');
  console.log(`[seo] robots.txt sitemap line → ${SITE_URL}/sitemap.xml`);
}
