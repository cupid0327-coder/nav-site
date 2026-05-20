'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api-client';
import type { Category, Link as LinkRow } from '@/db/schema';

export default function LinksPage() {
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [iconUrl, setIconUrl] = useState<string>('');
  const [iconBusy, setIconBusy] = useState(false);

  async function load() {
    const [links, categories] = await Promise.all([
      apiFetch<LinkRow[]>('/api/links'),
      apiFetch<Category[]>('/api/categories'),
    ]);
    setRows(links);
    setCats(categories);
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setIconUrl('');
    setOpen(true);
  }
  function openEdit(row: LinkRow) {
    setEditing(row);
    setIconUrl(row.iconUrl ?? '');
    setOpen(true);
  }

  async function refreshFavicon(url: string) {
    if (!url) return;
    setIconBusy(true);
    try {
      const res = await apiFetch<{ url: string }>('/api/favicon', { method: 'POST', body: JSON.stringify({ url }) });
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      categoryId: Number(form.get('categoryId')),
      title: String(form.get('title') || ''),
      url: String(form.get('url') || ''),
      description: (String(form.get('description') || '') || null) as string | null,
      iconUrl: iconUrl || null,
      order: Number(form.get('order') || 0),
      hidden: form.get('hidden') === 'on',
    };
    if (editing) {
      await apiFetch(`/api/links/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiFetch('/api/links', { method: 'POST', body: JSON.stringify(payload) });
    }
    setOpen(false);
    setEditing(null);
    load();
  }

  async function onDelete(id: number) {
    if (!confirm('确认删除？')) return;
    await apiFetch(`/api/links/${id}`, { method: 'DELETE' });
    load();
  }

  async function toggleHidden(row: LinkRow) {
    await apiFetch(`/api/links/${row.id}`, {
      method: 'PUT',
      body: JSON.stringify({ hidden: !row.hidden }),
    });
    load();
  }

  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">链接管理</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> 新建链接
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? '编辑链接' : '新建链接'}</DialogTitle>
              <DialogDescription>新建时未指定图标会自动抓取目标站点 favicon</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="title">标题</Label>
                  <Input id="title" name="title" defaultValue={editing?.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">分类</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    defaultValue={editing?.categoryId ?? cats[0]?.id}
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
                <Label htmlFor="url">URL</Label>
                <Input id="url" name="url" type="url" defaultValue={editing?.url} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述（可选）</Label>
                <Textarea id="description" name="description" defaultValue={editing?.description ?? ''} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>图标</Label>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconUrl} alt="icon" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">无</span>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">排序</Label>
                <Input id="order" name="order" type="number" defaultValue={editing?.order ?? 0} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="hidden"
                  name="hidden"
                  type="checkbox"
                  defaultChecked={editing?.hidden ?? false}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="hidden" className="cursor-pointer">隐藏（未登录访客看不到）</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={iconBusy}>保存</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="w-12 px-4 py-2 font-medium">图标</th>
              <th className="px-4 py-2 font-medium">标题</th>
              <th className="px-4 py-2 font-medium">分类</th>
              <th className="px-4 py-2 font-medium">URL</th>
              <th className="px-4 py-2 font-medium">排序</th>
              <th className="px-4 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={'border-t ' + (r.hidden ? 'opacity-60' : '')}>
                <td className="px-4 py-2">
                  {r.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.iconUrl} alt="" className="h-6 w-6 rounded" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2 font-medium">{r.title}</td>
                <td className="px-4 py-2 text-muted-foreground">{catMap.get(r.categoryId) || r.categoryId}</td>
                <td className="px-4 py-2">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {r.url.length > 50 ? r.url.slice(0, 50) + '…' : r.url}
                  </a>
                </td>
                <td className="px-4 py-2">{r.order}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={r.hidden ? '点击显示' : '点击隐藏'}
                      onClick={() => toggleHidden(r)}
                    >
                      {r.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  暂无链接，先创建分类后再添加
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
