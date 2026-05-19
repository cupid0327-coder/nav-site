import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchAndSaveFavicon } from '@/lib/favicon';

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  const iconUrl = await fetchAndSaveFavicon(url);
  if (!iconUrl) return NextResponse.json({ error: 'Failed to fetch favicon' }, { status: 502 });
  return NextResponse.json({ url: iconUrl });
});
