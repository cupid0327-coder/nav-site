import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { categories, links, searchEngines, settings } from '@/db/schema';
import { SearchBar } from '@/components/public/search-bar';
import { ThemeToggle } from '@/components/theme-toggle';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [cats, allLinks, engines, settingRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.order), asc(categories.id)),
    db.select().from(links).orderBy(asc(links.order), asc(links.id)),
    db.select().from(searchEngines).orderBy(asc(searchEngines.order), asc(searchEngines.id)),
    db.select().from(settings),
  ]);

  const settingMap = Object.fromEntries(settingRows.map((r) => [r.key, r.value]));
  const title = settingMap.siteTitle || 'My Nav';
  const subtitle = settingMap.siteSubtitle || '个人导航站';

  const linksByCategory = new Map<number, typeof allLinks>();
  for (const l of allLinks) {
    const arr = linksByCategory.get(l.categoryId) ?? [];
    arr.push(l);
    linksByCategory.set(l.categoryId, arr);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="text-base font-semibold">{title}</div>
          <ThemeToggle />
        </div>
      </header>

      <section className="container space-y-6 py-16">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <SearchBar engines={engines} />
      </section>

      <section className="container space-y-10 pb-20">
        {cats.length === 0 ? (
          <p className="text-center text-muted-foreground">
            还没有分类和链接，<a href="/admin" className="text-primary underline">前往后台</a>开始配置。
          </p>
        ) : (
          cats.map((cat) => {
            const items = linksByCategory.get(cat.id) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={cat.id}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  {cat.icon && <span aria-hidden>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {items.map((l) => (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      title={l.description || l.title}
                      className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/40">
                        {l.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.iconUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            {l.title.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{l.title}</div>
                        {l.description && (
                          <div className="truncate text-xs text-muted-foreground">{l.description}</div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {title}
      </footer>
    </div>
  );
}
