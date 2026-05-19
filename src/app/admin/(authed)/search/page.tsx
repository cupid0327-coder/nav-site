'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { SearchEngine } from '@/db/schema';

export default function SearchEnginesPage() {
  const [rows, setRows] = useState<SearchEngine[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SearchEngine | null>(null);

  async function load() {
    setRows(await apiFetch<SearchEngine[]>('/api/search-engines'));
  }
  useEffect(() => { load(); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || ''),
      urlTemplate: String(form.get('urlTemplate') || ''),
      icon: (String(form.get('icon') || '') || null) as string | null,
      isDefault: form.get('isDefault') === 'on',
      order: Number(form.get('order') || 0),
    };
    if (editing) {
      await apiFetch(`/api/search-engines/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiFetch('/api/search-engines', { method: 'POST', body: JSON.stringify(payload) });
    }
    setOpen(false);
    setEditing(null);
    load();
  }
  async function onDelete(id: number) {
    if (!confirm('删除该搜索引擎？')) return;
    await apiFetch(`/api/search-engines/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">搜索引擎</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> 新建
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? '编辑搜索引擎' : '新建搜索引擎'}</DialogTitle>
              <DialogDescription>URL 模板中用 {'{q}'} 表示关键词占位</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urlTemplate">URL 模板</Label>
                <Input
                  id="urlTemplate"
                  name="urlTemplate"
                  placeholder="https://www.google.com/search?q={q}"
                  defaultValue={editing?.urlTemplate}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">图标（emoji 或 URL，可选）</Label>
                <Input id="icon" name="icon" defaultValue={editing?.icon ?? ''} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  defaultChecked={editing?.isDefault}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isDefault">设为默认</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">排序</Label>
                <Input id="order" name="order" type="number" defaultValue={editing?.order ?? 0} />
              </div>
              <DialogFooter>
                <Button type="submit">保存</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">名称</th>
              <th className="px-4 py-2 font-medium">URL 模板</th>
              <th className="px-4 py-2 font-medium">图标</th>
              <th className="px-4 py-2 font-medium">默认</th>
              <th className="px-4 py-2 font-medium">排序</th>
              <th className="px-4 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.urlTemplate}</td>
                <td className="px-4 py-2">{r.icon || '—'}</td>
                <td className="px-4 py-2">{r.isDefault ? '✓' : ''}</td>
                <td className="px-4 py-2">{r.order}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}>
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
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无搜索引擎</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
