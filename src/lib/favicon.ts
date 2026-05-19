import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'node-html-parser';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'icons');
const PUBLIC_PREFIX = '/uploads/icons';
const FETCH_TIMEOUT = 8000;

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; NavSiteBot/1.0; +https://github.com/) FaviconFetcher',
        ...(init?.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function pickIconFromHtml(html: string, baseUrl: string): string | null {
  try {
    const root = parse(html);
    const candidates = root.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]',
    );
    let best: { href: string; size: number } | null = null;
    for (const el of candidates) {
      const href = el.getAttribute('href');
      if (!href) continue;
      const sizesAttr = el.getAttribute('sizes') || '';
      const sizeMatch = sizesAttr.match(/(\d+)x\d+/);
      const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;
      if (!best || size > best.size) {
        best = { href, size };
      }
    }
    if (best) return new URL(best.href, baseUrl).toString();
  } catch {
    /* ignore */
  }
  return null;
}

async function tryDownload(iconUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetchWithTimeout(iconUrl);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}

function inferExt(buf: Buffer): string {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'gif';
  if (buf[0] === 0x3c) return 'svg';
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return 'ico';
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'webp';
  return 'png';
}

export async function saveIconBuffer(buf: Buffer, origin: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const hash = createHash('sha1').update(origin).update(buf).digest('hex').slice(0, 16);
  const ext = inferExt(buf);
  const filename = `${hash}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buf);
  return `${PUBLIC_PREFIX}/${filename}`;
}

export async function fetchAndSaveFavicon(targetUrl: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    return null;
  }

  let iconUrl: string | null = null;
  try {
    const res = await fetchWithTimeout(url.toString());
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const html = await res.text();
        iconUrl = pickIconFromHtml(html, url.toString());
      }
    }
  } catch {
    /* ignore */
  }

  if (!iconUrl) {
    iconUrl = new URL('/favicon.ico', url.origin).toString();
  }

  let buf = await tryDownload(iconUrl);
  if (!buf) {
    const fallback = `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
    buf = await tryDownload(fallback);
  }
  if (!buf) return null;

  return saveIconBuffer(buf, url.hostname);
}
