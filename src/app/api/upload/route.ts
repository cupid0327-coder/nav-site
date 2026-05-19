import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveIconBuffer } from '@/lib/favicon';

const MAX_SIZE = 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/gif'];

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const url = await saveIconBuffer(buf, file.name);
  return NextResponse.json({ url });
});
