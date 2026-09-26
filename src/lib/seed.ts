import { hashPassword } from "./crypto";
import type { Queryable } from "./db";

// Sunum için hazır hesaplar. Şifreleri .env.local'daki DEMO_PASSWORD.
type Demo = {
  email: string;
  name: string;
  role: "musteri" | "kasiyer";
  stamps: number;
  free: number;
  earned: number;
  // Geçmiş: [kaç gün önce, tür, adet]
  history: [number, "stamp" | "reward_earned" | "reward_used", number][];
};

export const DEMO_USERS: Demo[] = [
  { email: "kasiyer@telve.test", name: "Barista Deniz", role: "kasiyer", stamps: 0, free: 0, earned: 0, history: [] },
  {
    // 9/10: tek okutmada hediye kazanma anını göstermek için.
    email: "ayse@telve.test",
    name: "Ayşe Demir",
    role: "musteri",
    stamps: 9,
    free: 1,
    earned: 2,
    history: [
      [24, "stamp", 1],
      [21, "stamp", 1],
      [20, "reward_used", 1],
      [9, "stamp", 2],
      [6, "stamp", 1],
      [5, "reward_earned", 1],
      [3, "stamp", 1],
      [1, "stamp", 1],
      [0, "stamp", 1],
    ],
  },
  {
    email: "mehmet@telve.test",
    name: "Mehmet Kaya",
    role: "musteri",
    stamps: 3,
    free: 0,
    earned: 0,
    history: [
      [4, "stamp", 1],
      [2, "stamp", 1],
      [1, "stamp", 1],
    ],
  },
];

/**
 * Demo hesaplarını oluşturur. reset=false: sadece eksik olanları ekler (sunucu açılışında).
 * reset=true: demo hesaplarını silip baştan kurar (sunumdan önce `npm run seed`).
 */
export async function seedDemo(q: Queryable, password: string, reset = false): Promise<string[]> {
  const created: string[] = [];
  const hash = await hashPassword(password);

  for (const d of DEMO_USERS) {
    if (reset) await q.query("delete from users where email = $1", [d.email]);
    const rows = await q.query<{ id: string }>(
      `insert into users (name, phone, email, password_hash, role, stamps, free_drinks, total_earned, total_coffees, created_at)
       values ($1, '05000000000', $2, $3, $4, $5, $6, $7, $8, now() - interval '7 months')
       on conflict (email) do nothing
       returning id`,
      [d.name, d.email, hash, d.role, d.stamps, d.free, d.earned, d.earned * 10 + d.stamps],
    );
    const id = rows[0]?.id;
    if (!id) continue;
    created.push(d.email);
    for (const [daysAgo, kind, count] of d.history) {
      await q.query(
        `insert into transactions (user_id, kind, count, created_at)
         values ($1, $2, $3, now() - make_interval(days => $4) - make_interval(mins => $5))`,
        [id, kind, count, daysAgo, 30 + daysAgo * 17],
      );
    }
  }
  return created;
}
