import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import { categories, links, searchEngines, users } from '../src/db/schema';

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  const existing = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await db.insert(users).values({ username, passwordHash: hash });
    console.log(`✓ admin user created: ${username} / ${password}`);
  } else {
    console.log(`• admin user exists: ${username}`);
  }

  const engineCount = (await db.select().from(searchEngines)).length;
  if (engineCount === 0) {
    await db.insert(searchEngines).values([
      { name: 'Google', urlTemplate: 'https://www.google.com/search?q={q}', isDefault: true, order: 0 },
      { name: 'Bing', urlTemplate: 'https://www.bing.com/search?q={q}', order: 1 },
      { name: '百度', urlTemplate: 'https://www.baidu.com/s?wd={q}', order: 2 },
      { name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q={q}', order: 3 },
    ]);
    console.log('✓ default search engines created');
  }

  const catCount = (await db.select().from(categories)).length;
  if (catCount === 0) {
    const [dev] = await db.insert(categories).values({ name: '常用', icon: '🌟', order: 0 }).returning();
    await db.insert(links).values([
      { categoryId: dev.id, title: 'GitHub', url: 'https://github.com', order: 0 },
      { categoryId: dev.id, title: 'MDN', url: 'https://developer.mozilla.org', order: 1 },
    ]);
    console.log('✓ sample category & links created');
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
