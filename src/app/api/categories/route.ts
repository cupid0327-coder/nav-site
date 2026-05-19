import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { categorySchema, reorderSchema } from '@/lib/validation';

export async function GET() {
  const rows = await db.select().from(categories).orderBy(asc(categories.order), asc(categories.id));
  return NextResponse.json(rows);
}

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const [created] = await db.insert(categories).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
});

export const PATCH = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  for (const item of parsed.data) {
    await db.update(categories).set({ order: item.order }).where(eq(categories.id, item.id));
  }
  return NextResponse.json({ ok: true });
});
