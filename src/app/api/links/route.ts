import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { links } from '@/db/schema';
import { linkSchema, reorderSchema } from '@/lib/validation';
import { fetchAndSaveFavicon } from '@/lib/favicon';

export async function GET() {
  const rows = await db.select().from(links).orderBy(asc(links.order), asc(links.id));
  return NextResponse.json(rows);
}

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = linkSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let { iconUrl, ...rest } = parsed.data;
  if (!iconUrl) {
    iconUrl = (await fetchAndSaveFavicon(rest.url)) ?? null;
  }

  const [created] = await db.insert(links).values({ ...rest, iconUrl }).returning();
  return NextResponse.json(created, { status: 201 });
});

export const PATCH = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  for (const item of parsed.data) {
    await db.update(links).set({ order: item.order }).where(eq(links.id, item.id));
  }
  return NextResponse.json({ ok: true });
});
