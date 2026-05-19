'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import type { SearchEngine } from '@/db/schema';

export function SearchBar({ engines }: { engines: SearchEngine[] }) {
  const defaultEngine = engines.find((e) => e.isDefault) || engines[0];
  const [engineId, setEngineId] = React.useState<number | undefined>(defaultEngine?.id);
  const [q, setQ] = React.useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const engine = engines.find((x) => x.id === engineId) || defaultEngine;
    if (!engine || !q.trim()) return;
    const target = engine.urlTemplate.replace('{q}', encodeURIComponent(q.trim()));
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  if (!defaultEngine) return null;

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-2xl items-center gap-2">
      <select
        value={engineId}
        onChange={(e) => setEngineId(Number(e.target.value))}
        className="h-12 rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {engines.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索..."
          className="h-12 w-full rounded-lg border bg-background pl-11 pr-4 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          autoFocus
        />
      </div>
      <button
        type="submit"
        className="h-12 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        搜索
      </button>
    </form>
  );
}
