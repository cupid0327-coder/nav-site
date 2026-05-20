'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react';
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
import type { Category } from '@/db/schema';

const ICON_PRESETS = [
  '🔍', '📚', '📖', '📰', '📝', '📁', '📂', '🗂️',
  '💻', '🖥️', '⌨️', '🖱️', '📱', '💾', '💿', '🔌',
  '🎬', '🎞️', '🎵', '🎧', '🎮', '🕹️', '🎨', '🖼️',
  '🛠️', '🔧', '⚙️', '🧰', '🧪', '🧬', '🔬', '🔭',
  '💼', '🏢', '📊', '📈', '📉', '💰', '💳', '🪙',
  '🌐', '☁️', '🔐', '🔑', '🛡️', '🧱', '🚀', '⚡',
  '🤖', '🧠', '✨', '⭐', '🔥', '💡', '🎯', '🏆',
  '🛒', '🎁', '📦', '✉️', '📮', '🔔', '📌', '🏷️',
  '☕', '🍔', '🍣', '🏠', '🚗', '✈️', '🌍', '🗺️',
];

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex gap-2">
        <Input
          id="icon"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="emoji 或图片 URL"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0"
        >
          <span className="mr-1 text-base leading-none">{value || '🙂'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-md border bg-popover p-2 shadow-md">
          <div className="grid grid-cols-8 gap-1">
            {ICON_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent ${
                  value === emoji ? 'bg-accent ring-1 ring-primary' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 text-xs text-muted-foreground">
            <span>点击选择，或在输入框自定义</span>
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              清除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [icon, setIcon] = useState('');
  const [, startTransition] = useTransition();

  async function load() {
    const data = await apiFetch<Category[]>('/api/categories');
    setRows(data);
  }
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (open) setIcon(editing?.icon ?? '');
  }, [open, editing]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || ''),
      icon: (icon || null) as string | null,
      order: Number(form.get('order') || 0),
    };
    if (editing) {
      await apiFetch(`/api/categories/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(payload) });
    }
    setOpen(false);
    setEditing(null);
    startTransition(() => {
      load();
    });
  }

  async function onDelete(id: number) {
    if (!confirm('删除该分类将同时删除该分类下所有链接，确定吗？')) return;
    await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">分类管理</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> 新建分类
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? '编辑分类' : '新建分类'}</DialogTitle>
              <DialogDescription>用于组织前台展示的链接分组</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">图标（emoji 或 URL，可选）</Label>
                <IconPicker value={icon} onChange={setIcon} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">排序（数字越小越靠前）</Label>
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
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">名称</th>
              <th className="px-4 py-2 font-medium">图标</th>
              <th className="px-4 py-2 font-medium">排序</th>
              <th className="px-4 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2 text-muted-foreground">{r.id}</td>
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2 text-lg">{r.icon || '—'}</td>
                <td className="px-4 py-2">{r.order}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(r);
                        setOpen(true);
                      }}
                    >
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
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  暂无分类
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
