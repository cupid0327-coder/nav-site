'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';

export default function SettingsPage() {
  const [siteTitle, setSiteTitle] = useState('');
  const [siteSubtitle, setSiteSubtitle] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<Record<string, string>>('/api/settings').then((s) => {
      setSiteTitle(s.siteTitle || '');
      setSiteSubtitle(s.siteSubtitle || '');
    });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ siteTitle, siteSubtitle }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">站点设置</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="siteTitle">站点标题</Label>
          <Input id="siteTitle" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="My Nav" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteSubtitle">副标题 / 标语</Label>
          <Input id="siteSubtitle" value={siteSubtitle} onChange={(e) => setSiteSubtitle(e.target.value)} placeholder="个人导航站" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit">保存</Button>
          {saved && <span className="text-sm text-muted-foreground">已保存 ✓</span>}
        </div>
      </form>
    </div>
  );
}
