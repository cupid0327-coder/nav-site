# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server (defaults to :3000, falls back if taken)
npm run build        # Production build (outputs .next/standalone)
npm run lint         # next lint (eslint-config-next)
npm run db:push      # Sync schema directly into the DB without writing a migration (dev only)
npm run db:migrate   # Apply migrations in src/db/migrations via scripts/migrate.ts
npm run db:seed      # Seed admin user + default search engines + sample data
npm run db:studio    # Drizzle Studio
npx drizzle-kit generate   # Generate a new migration file from schema changes
```

There is no test suite in this repo.

Environment: copy `.env.example` to `.env`. Required: `AUTH_SECRET` (generate via `openssl rand -base64 32`), `AUTH_TRUST_HOST=true`, optional `DATABASE_URL` (defaults to `./data/app.db`). `SEED_ADMIN_*` only used by `db:seed`.

## Architecture

Next.js 14 App Router + TypeScript + Tailwind. Single SQLite file (`data/app.db`) accessed through Drizzle ORM on top of `better-sqlite3` (synchronous). Single-admin auth via Auth.js (NextAuth v5) with a Credentials provider; everything else is public.

### Auth flow
- `src/lib/auth.ts` exports `{ handlers, auth, signIn, signOut }`. `auth.config.ts` is the edge-safe subset (no bcrypt, no DB) re-used by the middleware.
- `src/middleware.ts` matches `/admin/:path*` and uses the config's `authorized` callback to gate everything except `/admin/login`.
- Route layout enforces this twice: `src/app/admin/(authed)/layout.tsx` calls `await auth()` and redirects to `/admin/login` if no session. The `(authed)` route group is the protected admin shell with the sidebar.
- API routes that mutate use the wrapper pattern: `export const POST = auth(async (req) => { if (!req.auth) return 401; ... })`. Public endpoints (e.g. `POST /api/submissions`) are plain `export async function POST(req)` and apply their own checks (rate limit).

### Data layer
- `src/db/index.ts` is a module-level singleton. It enables `journal_mode=WAL` and `foreign_keys=ON`, and auto-creates the data directory.
- Schema lives in `src/db/schema.ts`. Migrations are in `src/db/migrations/` with `meta/_journal.json` + per-tag snapshots. **Always use `npx drizzle-kit generate`** — never hand-write snapshots.
- `scripts/migrate.ts` runs `migrate()` from `drizzle-orm/better-sqlite3/migrator`. It uses raw file SHA-256 (not the breakpoint-stripped SQL) to track applied migrations in `__drizzle_migrations`.
- **Gotcha**: this DB was originally bootstrapped with `db:push`, so `__drizzle_migrations` was empty when migrations were first introduced. The 0000 migration is now marked as applied manually (its hash `35968f86...` was inserted into `__drizzle_migrations`). New migrations just append normally.
- `db.transaction((tx) => {...})` is sync — see `src/app/api/submissions/[id]/approve/route.ts` for the pattern used when inserting a link and updating submission status atomically.

### Validation
All POST/PUT bodies go through Zod schemas in `src/lib/validation.ts`. `linkSchema.partial()` is used by `PUT /api/links/[id]` so any subset (e.g. just `{ hidden: true }`) is accepted — this is how the inline hide-toggle button works without a separate endpoint.

### Frontend conventions
- `src/lib/api-client.ts` `apiFetch<T>()` is the thin JSON fetch wrapper used by all admin client components.
- Admin pages under `(authed)/` are client components that load through `apiFetch` and re-load after each mutation. The public homepage is a server component that queries Drizzle directly and calls `auth()` to decide whether to show hidden links and the per-card `EyeOff` badge.
- UI primitives in `src/components/ui/` are shadcn-style (Radix + CVA + `cn()` helper from `src/lib/utils.ts`). Icons are `lucide-react`.

### Favicon pipeline
`src/lib/favicon.ts` `fetchAndSaveFavicon(targetUrl)` is the only place that fetches/saves icons. It tries HTML `<link rel="icon">` → `/favicon.ico` → Google S2, sniffs the magic bytes for the extension, and saves to `public/uploads/icons/{sha1}.{ext}`. Called automatically by `POST /api/links` and the approval flow when `iconUrl` is empty.

### Rate limiting
`src/lib/rate-limit.ts` is an in-memory sliding-window limiter (per key, per hour, default 10 hits). Used by `POST /api/submissions`. Single-process only — fine because production runs as a single PM2 process.

### Public submission → admin approval flow
1. Visitor submits via `RecommendDialog` (`src/components/public/recommend-dialog.tsx`) → `POST /api/submissions` (rate-limited, inserts into `link_submissions` with `status='pending'`).
2. Admin reviews at `/admin/submissions`. Approve dialog reuses the favicon picker UI from links and sends `POST /api/submissions/[id]/approve` with a full `linkSchema` body. That route runs a sync transaction: insert into `links`, set submission to `approved`.

### Hidden links
`links.hidden` is filtered server-side in `src/app/page.tsx` (not in the API — the admin links list needs the full set). Logged-in admins see hidden links on the homepage with an `EyeOff` badge so they can preview before unhiding.

## Deploy

PM2 + Nginx on a VPS. `npm run build` produces `.next/standalone`; copy `public/` and `.next/static/` into it, then `pm2 start ecosystem.config.cjs`. Nginx example at `deploy/nginx.conf.example` (already forwards `X-Real-IP` / `X-Forwarded-For`, which the submissions rate limiter depends on). Backup = copy `data/app.db`.

**Single-process constraint**: `ecosystem.config.cjs` runs `instances: 1, exec_mode: 'fork'`. Do not change to cluster mode — the in-memory rate limiter and the better-sqlite3 connection are per-process and would diverge across workers.

**Upgrade path for existing deployments**: `git pull && npm ci && npm run db:migrate && npm run build`, recopy `public/` + `.next/static/` into `.next/standalone/`, then `pm2 restart n_site`. If the instance was originally bootstrapped with `db:push` (empty `__drizzle_migrations`), the first `db:migrate` will hit "table already exists" — see the Data layer gotcha above for the SHA-256 workaround.
