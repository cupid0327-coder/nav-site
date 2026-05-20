import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { linkSubmissions } from '@/db/schema';

export const DELETE = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((ctx?.params as { id: string }).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await db.delete(linkSubmissions).where(eq(linkSubmissions.id, id));
  return NextResponse.json({ ok: true });
});
