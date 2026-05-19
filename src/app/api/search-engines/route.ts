import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { searchEngines } from '@/db/schema';
import { searchEngineSchema } from '@/lib/validation';

export async function GET() {
  const rows = await db.select().from(searchEngines).orderBy(asc(searchEngines.order), asc(searchEngines.id));
  return NextResponse.json(rows);
}

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = searchEngineSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.isDefault) {
    await db.update(searchEngines).set({ isDefault: false });
  }
  const [created] = await db.insert(searchEngines).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
});
