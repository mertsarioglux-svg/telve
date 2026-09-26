import type { Sql, TransactionSql } from "postgres";
import { SCHEMA } from "./schema";
import { seedDemo } from "./seed";

type Row = Record<string, unknown>;

export interface Queryable {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

export interface Db extends Queryable {
  /** Fonksiyon içindeki bütün sorgular tek bir işlemde (transaction) çalışır; hata olursa hepsi geri alınır. */
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}

// DATABASE_URL varsa gerçek Postgres (Supabase / Neon), yoksa .data/ klasöründe gömülü PGlite.
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { default: postgres } = await import("postgres");
    // prepare:false → Supabase'in transaction pooler'ı ile uyumlu.
    const sql = postgres(url, { prepare: false, max: 5, onnotice: () => {} });
    await sql.unsafe(SCHEMA);
    const wrap = (s: Sql | TransactionSql): Queryable => ({
      query: async <T extends Row>(text: string, params: unknown[] = []) =>
        (await s.unsafe(text, params as never[])) as unknown as T[],
    });
    return withDemo({
      ...wrap(sql),
      tx: async (fn) => (await sql.begin((t) => fn(wrap(t)))) as never,
    });
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.cwd() + "/.data/pglite";
  mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  await pg.exec(SCHEMA);
  type PgLike = Pick<typeof pg, "query">;
  const wrap = (p: PgLike): Queryable => ({
    query: async <T extends Row>(text: string, params: unknown[] = []) => (await p.query<T>(text, params)).rows,
  });
  return withDemo({
    ...wrap(pg),
    tx: (fn) => pg.transaction((t) => fn(wrap(t))),
  });
}

// DEMO_PASSWORD tanımlıysa demo hesapları (kasiyer + 2 müşteri) eksikse oluşturulur.
async function withDemo(d: Db): Promise<Db> {
  const pw = process.env.DEMO_PASSWORD;
  if (pw) {
    const created = await seedDemo(d, pw);
    if (created.length) console.log(`[telve] Demo hesapları oluşturuldu: ${created.join(", ")}`);
  }
  return d;
}

// Geliştirme sırasında sıcak yenilemede yeni bağlantı açılmasın diye globalde tutulur.
const g = globalThis as unknown as { __telveDb?: Promise<Db> };

export function db(): Promise<Db> {
  g.__telveDb ??= connect().catch((err) => {
    g.__telveDb = undefined;
    throw err;
  });
  return g.__telveDb;
}
