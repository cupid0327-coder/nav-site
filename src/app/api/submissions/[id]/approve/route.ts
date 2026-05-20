import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { links, linkSubmissions } from '@/db/schema';
import { linkSchema } from '@/lib/validation';
import { fetchAndSaveFavicon } from '@/lib/favicon';

export const POST = auth(async (req, ctx) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number((ctx?.params as { id: string }).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const submission = await db.query.linkSubmissions.findFirst({
    where: eq(linkSubmissions.id, id),
  });
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (submission.status === 'approved') {
    return NextResponse.json({ error: '该推荐已通过' }, { status: 400 });
  }

  const parsed = linkSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let { iconUrl, ...rest } = parsed.data;
  if (!iconUrl) {
    iconUrl = (await fetchAndSaveFavicon(rest.url)) ?? null;
  }

  const created = db.transaction((tx) => {
    const [row] = tx.insert(links).values({ ...rest, iconUrl }).returning().all();
    tx.update(linkSubmissions)
      .set({ status: 'approved', reviewedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(linkSubmissions.id, id))
      .run();
    return row;
  });

  return NextResponse.json(created, { status: 201 });
});
