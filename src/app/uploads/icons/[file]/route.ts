import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  webp: 'image/webp',
};

// favicon.ts emits filenames like `<16-hex>.<ext>` — reject anything else to
// prevent path traversal and to keep this handler narrow.
const FILE_RE = /^[a-f0-9]{16}\.(png|jpg|jpeg|gif|svg|ico|webp)$/;

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const file = params.file;
  if (!FILE_RE.test(file)) return new NextResponse(null, { status: 404 });

  const ext = file.split('.').pop()!.toLowerCase();
  const fullPath = path.join(process.cwd(), 'public', 'uploads', 'icons', file);

  let buf: Buffer;
  try {
    buf = await readFile(fullPath);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(buf.length),
    },
  });
}
