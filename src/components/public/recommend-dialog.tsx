'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
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

export function RecommendDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get('title') || '').trim(),
      url: String(form.get('url') || '').trim(),
      description: String(form.get('description') || '').trim() || null,
      note: String(form.get('note') || '').trim() || null,
    };
    setBusy(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try {
          const j = JSON.parse(text);
          if (typeof j.error === 'string') msg = j.error;
        } catch { /* ignore */ }
        if (res.status === 429) msg = msg || '提交过于频繁，请稍后再试';
        throw new Error(msg || `提交失败 (${res.status})`);
      }
      setDone(true);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setDone(false);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="推荐网址"
          className="text-muted-foreground hover:text-accent-foreground"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">推荐网址</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>推荐网址</DialogTitle>
          <DialogDescription>提交后将进入审核队列，由管理员审核通过后展示。</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">提交成功，感谢推荐！</p>
            <DialogFooter>
              <Button onClick={() => setDone(false)} variant="outline">继续推荐</Button>
              <Button onClick={() => handleOpenChange(false)}>关闭</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rec-title">标题</Label>
              <Input id="rec-title" name="title" required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-url">URL</Label>
              <Input id="rec-url" name="url" type="url" required maxLength={500} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-desc">描述（可选）</Label>
              <Textarea id="rec-desc" name="description" rows={2} maxLength={300} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-note">备注 / 联系方式（可选）</Label>
              <Textarea id="rec-note" name="note" rows={2} maxLength={500} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={busy}>{busy ? '提交中…' : '提交推荐'}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
