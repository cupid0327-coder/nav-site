import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { linkSubmissions } from '@/db/schema';
import { linkSubmissionSchema } from '@/lib/validation';
import { getClientIp, hitRateLimit } from '@/lib/rate-limit';

const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (hitRateLimit(`submit:${ip}`)) {
    return NextResponse.json({ error: '提交过于频繁，请稍后再试' }, { status: 429 });
  }
  const parsed = linkSubmissionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [created] = await db
    .insert(linkSubmissions)
    .values({
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description ?? null,
      note: parsed.data.note ?? null,
      submitterIp: ip,
    })
    .returning({ id: linkSubmissions.id });
  return NextResponse.json(created, { status: 201 });
}

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? 'pending';
  const where = status === 'all'
    ? undefined
    : VALID_STATUSES.includes(status as Status)
      ? eq(linkSubmissions.status, status)
      : eq(linkSubmissions.status, 'pending');
  const rows = where
    ? await db.select().from(linkSubmissions).where(where).orderBy(desc(linkSubmissions.createdAt))
    : await db.select().from(linkSubmissions).orderBy(desc(linkSubmissions.createdAt));
  return NextResponse.json(rows);
});
