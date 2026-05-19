import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../src/db';

migrate(db, { migrationsFolder: './src/db/migrations' });
console.log('✓ migrations applied');
process.exit(0);
