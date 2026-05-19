import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { db } from '@/db';
import { settings } from '@/db/schema';
import './globals.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const rows = await db.select().from(settings);
  const settingMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    title: settingMap.siteTitle || 'My Nav',
    description: settingMap.siteSubtitle || '个人导航站',
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
