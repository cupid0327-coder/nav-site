import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon'),
  order: integer('order').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const links = sqliteTable('links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  order: integer('order').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const searchEngines = sqliteTable('search_engines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  urlTemplate: text('url_template').notNull(),
  icon: text('icon'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false).notNull(),
  order: integer('order').default(0).notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const linkSubmissions = sqliteTable('link_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  note: text('note'),
  status: text('status').notNull().default('pending'),
  submitterIp: text('submitter_ip'),
  reviewedAt: text('reviewed_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type Link = typeof links.$inferSelect;
export type SearchEngine = typeof searchEngines.$inferSelect;
export type User = typeof users.$inferSelect;
export type LinkSubmission = typeof linkSubmissions.$inferSelect;
