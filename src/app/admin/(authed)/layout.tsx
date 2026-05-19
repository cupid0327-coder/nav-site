import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { Providers } from '../providers';
import { Button } from '@/components/ui/button';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  return (
    <Providers>
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r bg-muted/30 p-4 md:flex md:flex-col">
          <div className="mb-6 px-2 text-lg font-semibold">My Nav · 后台</div>
          <nav className="flex flex-1 flex-col gap-1 text-sm">
            <NavLink href="/admin/links">链接管理</NavLink>
            <NavLink href="/admin/categories">分类管理</NavLink>
            <NavLink href="/admin/search">搜索引擎</NavLink>
            <NavLink href="/admin/settings">站点设置</NavLink>
          </nav>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}
          >
            <Button type="submit" variant="outline" size="sm" className="w-full">
              退出登录
            </Button>
          </form>
        </aside>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </Providers>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
      {children}
    </Link>
  );
}
