import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { linkSubmissions } from '@/db/schema';

export const POST = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((ctx?.params as { id: string }).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const [updated] = await db
    .update(linkSubmissions)
    .set({ status: 'rejected', reviewedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(linkSubmissions.id, id))
    .returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
});
