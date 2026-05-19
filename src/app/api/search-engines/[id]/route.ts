import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { searchEngines } from '@/db/schema';
import { searchEngineSchema } from '@/lib/validation';

export const PUT = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((ctx?.params as { id: string }).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const parsed = searchEngineSchema.partial().safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.isDefault) {
    await db.update(searchEngines).set({ isDefault: false });
  }
  const [updated] = await db.update(searchEngines).set(parsed.data).where(eq(searchEngines.id, id)).returning();
  return NextResponse.json(updated);
});

export const DELETE = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((ctx?.params as { id: string }).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await db.delete(searchEngines).where(eq(searchEngines.id, id));
  return NextResponse.json({ ok: true });
});
