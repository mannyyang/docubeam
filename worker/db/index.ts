import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDatabase(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
export { schema };
