import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { links } from '@/db/schema';
import { linkSchema } from '@/lib/validation';

export const PUT = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((ctx?.params as { id: string }).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const parsed = linkSchema.partial().safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const [updated] = await db.update(links).set(parsed.data).where(eq(links.id, id)).returning();
  return NextResponse.json(updated);
});

export const DELETE = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((ctx?.params as { id: string }).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await db.delete(links).where(eq(links.id, id));
  return NextResponse.json({ ok: true });
});
