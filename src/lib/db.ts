import 'server-only';
import postgres from 'postgres';

/*
  One connection pool per server process, created on first use (so `next build` never needs a
  database). In development the module is re-evaluated on every hot reload, so the pool is kept
  on globalThis to avoid exhausting connections. Credentials come only from DATABASE_URL (.env).
*/

type Sql = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as { recutexDb?: Sql };

export function db(): Sql {
  if (!globalForDb.recutexDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set (see .env.example)');
    globalForDb.recutexDb = postgres(url, { max: 5, idle_timeout: 30 });
  }
  return globalForDb.recutexDb;
}
