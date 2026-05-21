import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchAndSaveFavicon } from '@/lib/favicon';

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: '请先填写 URL' }, { status: 400 });
  try {
    const iconUrl = await fetchAndSaveFavicon(url);
    if (!iconUrl) {
      return NextResponse.json(
        { error: '未能抓取到图标，可能是站点无 favicon 或网络不通' },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: iconUrl });
  } catch (e) {
    return NextResponse.json(
      { error: `抓取异常：${(e as Error).message || '未知错误'}` },
      { status: 502 },
    );
  }
});
