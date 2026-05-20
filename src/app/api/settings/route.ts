import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { settings } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.select().from(settings);
  const obj: Record<string, string> = {};
  for (const r of rows) obj[r.key] = r.value;
  return NextResponse.json(obj);
}

export const PUT = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json()) as Record<string, string>;
  for (const [key, value] of Object.entries(body)) {
    await db
      .insert(settings)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });
  }
  return NextResponse.json({ ok: true });
});
