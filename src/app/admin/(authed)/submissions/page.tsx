'use client';

import { useEffect, useState } from 'react';
import { Check, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api-client';
import type { Category, LinkSubmission } from '@/db/schema';

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
  { key: 'all', label: '全部' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

export default function SubmissionsPage() {
  const [rows, setRows] = useState<LinkSubmission[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [approving, setApproving] = useState<LinkSubmission | null>(null);
  const [iconUrl, setIconUrl] = useState('');
  const [iconBusy, setIconBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);

  async function load() {
    const list = await apiFetch<LinkSubmission[]>(`/api/submissions?status=${filter}`);
    setRows(list);
  }
  async function loadCats() {
    const list = await apiFetch<Category[]>('/api/categories');
    setCats(list);
  }
  useEffect(() => { load(); }, [filter]);
  useEffect(() => { loadCats(); }, []);

  function openApprove(row: LinkSubmission) {
    setApproving(row);
    setIconUrl('');
  }
  function closeApprove() {
    setApproving(null);
    setIconUrl('');
  }

  async function refreshFavicon(url: string) {
    if (!url) return;
    setIconBusy(true);
    try {
      const res = await apiFetch<{ url: string }>('/api/favicon', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      setIconUrl(res.url);
    } catch (e) {
      alert('抓取失败: ' + (e as Error).message);
    } finally {
      setIconBusy(false);
    }
  }

  async function onUpload(file: File) {
    setIconBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      setIconUrl(url);
    } catch (e) {
      alert('上传失败: ' + (e as Error).message);
    } finally {
      setIconBusy(false);
    }
  }

  async function onApproveSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!approving) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      categoryId: Number(form.get('categoryId')),
      title: String(form.get('title') || ''),
      url: String(form.get('url') || ''),
      description: (String(form.get('description') || '') || null) as string | null,
      iconUrl: iconUrl || null,
      order: Number(form.get('order') || 0),
    };
    setSubmitBusy(true);
    try {
      await apiFetch(`/api/submissions/${approving.id}/approve`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      closeApprove();
      load();
    } catch (err) {
      alert('通过失败: ' + (err as Error).message);
    } finally {
      setSubmitBusy(false);
    }
  }

  async function onReject(id: number) {
    if (!confirm('确认拒绝该推荐？')) return;
    await apiFetch(`/api/submissions/${id}/reject`, { method: 'POST' });
    load();
  }

  async function onDelete(id: number) {
    if (!confirm('确认删除该推荐记录？此操作不可恢复。')) return;
    await apiFetch(`/api/submissions/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">推荐审核</h1>
        <div className="flex gap-1 border-b">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={
                'border-b-2 px-3 py-2 text-sm transition-colors ' +
                (filter === t.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">标题</th>
              <th className="px-4 py-2 font-medium">URL</th>
              <th className="px-4 py-2 font-medium">描述</th>
              <th className="px-4 py-2 font-medium">备注</th>
              <th className="px-4 py-2 font-medium">提交时间</th>
              <th className="px-4 py-2 font-medium">状态</th>
              <th className="px-4 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-4 py-2 font-medium">{r.title}</td>
                <td className="px-4 py-2">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {r.url.length > 40 ? r.url.slice(0, 40) + '…' : r.url}
                  </a>
                </td>
                <td className="max-w-[200px] px-4 py-2 text-muted-foreground">
                  <div className="truncate" title={r.description ?? ''}>{r.description || '—'}</div>
                </td>
                <td className="max-w-[200px] px-4 py-2 text-muted-foreground">
                  <div className="truncate" title={r.note ?? ''}>{r.note || '—'}</div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{r.createdAt}</td>
                <td className="px-4 py-2">{STATUS_LABEL[r.status] ?? r.status}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {r.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="icon" title="通过" onClick={() => openApprove(r)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="拒绝" onClick={() => onReject(r.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" title="删除" onClick={() => onDelete(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  暂无推荐记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!approving} onOpenChange={(v) => { if (!v) closeApprove(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>通过推荐并创建链接</DialogTitle>
            <DialogDescription>请选择分类并确认信息，未指定图标会自动抓取目标站点 favicon。</DialogDescription>
          </DialogHeader>
          {approving && (
            <form onSubmit={onApproveSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ap-title">标题</Label>
                  <Input id="ap-title" name="title" defaultValue={approving.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ap-cat">分类</Label>
                  <select
                    id="ap-cat"
                    name="categoryId"
                    defaultValue={cats[0]?.id}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-url">URL</Label>
                <Input id="ap-url" name="url" type="url" defaultValue={approving.url} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-desc">描述</Label>
                <Textarea id="ap-desc" name="description" defaultValue={approving.description ?? ''} rows={2} />
              </div>
              {approving.note && (
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  <div className="mb-1 font-medium text-foreground">推荐人备注</div>
                  {approving.note}
                </div>
              )}
              <div className="space-y-2">
                <Label>图标</Label>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconUrl} alt="icon" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">自动</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={iconBusy}
                    onClick={() => {
                      const inp = document.querySelector<HTMLInputElement>('input[name=url]');
                      if (inp?.value) refreshFavicon(inp.value);
                    }}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" /> 抓取
                  </Button>
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-xs"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUpload(f);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">留空将在保存时自动抓取目标站点 favicon。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-order">排序</Label>
                <Input id="ap-order" name="order" type="number" defaultValue={0} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeApprove}>取消</Button>
                <Button type="submit" disabled={submitBusy || iconBusy}>
                  {submitBusy ? '保存中…' : '通过并创建'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
