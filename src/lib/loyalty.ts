import { randomInt } from "node:crypto";
import { db, type Queryable } from "./db";
import { fail } from "./http";
import { historyLabel, historyMeta, memberSince } from "./format";

/** Kaç damgada bir hediye kahve verilir. */
export const GOAL = 10;
/** Müşterinin QR'ı kaç saniye geçerli. Ekran görüntüsüyle tekrar kullanılamasın diye kısa. */
export const QR_TTL_SECONDS = 60;
export const BRANCH = "Merkez";

type UserRow = {
  id: string;
  member_no: number;
  name: string;
  phone: string;
  email: string;
  role: string;
  stamps: number;
  free_drinks: number;
  total_earned: number;
  total_coffees: number;
  notif_stamp: boolean;
  notif_gift: boolean;
  notif_promo: boolean;
  created_at: Date;
};

type TxRow = { kind: "stamp" | "reward_earned" | "reward_used"; count: number; created_at: Date };

export type HistoryItem = { label: string; meta: string; badge: string; free: boolean };

export type Summary = {
  name: string;
  phone: string;
  memberNo: string;
  since: string;
  stamps: number;
  goal: number;
  freeDrinks: number;
  totalEarned: number;
  totalCoffees: number;
  notif: { stamp: boolean; gift: boolean; promo: boolean };
  history: HistoryItem[];
  rewardLog: HistoryItem[];
};

// ── Müşteri özeti (ana ekranda gösterilen her şey) ─────────────────────────

export async function getSummary(userId: string): Promise<Summary> {
  const q = await db();
  const [u] = await q.query<UserRow>("select * from users where id = $1", [userId]);
  if (!u) fail("Hesap bulunamadı.", 404);

  const txs = await q.query<TxRow>(
    "select kind, count, created_at from transactions where user_id = $1 order by created_at desc, id desc limit 30",
    [userId],
  );
  const used = await q.query<TxRow>(
    "select kind, count, created_at from transactions where user_id = $1 and kind = 'reward_used' order by created_at desc limit 20",
    [userId],
  );

  const now = new Date();
  const toItem = (t: TxRow): HistoryItem => ({ ...historyLabel(t), meta: historyMeta(t.created_at, now, BRANCH) });

  return {
    name: u.name,
    phone: maskPhone(u.phone),
    memberNo: String(u.member_no).padStart(4, "0"),
    since: memberSince(new Date(u.created_at)),
    stamps: u.stamps,
    goal: GOAL,
    freeDrinks: u.free_drinks,
    totalEarned: u.total_earned,
    totalCoffees: u.total_coffees,
    notif: { stamp: u.notif_stamp, gift: u.notif_gift, promo: u.notif_promo },
    history: txs.slice(0, 12).map(toItem),
    rewardLog: used.map((t) => ({ label: "Hediye kahve", meta: historyMeta(t.created_at, now, "kullanıldı"), badge: "KULLANILDI", free: false })),
  };
}

function maskPhone(digits: string): string {
  return `${digits.slice(0, 4)} ••• ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
}

// ── QR kodu ─────────────────────────────────────────────────────────────────
// QR'ın içinde müşterinin kimliği YOK; sadece 60 sn geçerli, tek kullanımlık rastgele bir kod var.
// Kod veritabanında müşteriye bağlanır. Yeni kod istenince eskisi hemen geçersiz olur.

export async function issueQr(userId: string): Promise<{ code: string; expiresAt: string }> {
  const q = await db();
  return q.tx(async (t) => {
    await t.query("update qr_codes set expires_at = now() where user_id = $1 and used_at is null and expires_at > now()", [userId]);
    // Eski kodları temizle ki tablo şişmesin.
    await t.query("delete from qr_codes where expires_at < now() - interval '1 day'");

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = String(randomInt(1_000_000, 10_000_000)); // 7 hane
      const rows = await t.query<{ expires_at: Date }>(
        `insert into qr_codes (code, user_id, expires_at)
         values ($1, $2, now() + make_interval(secs => $3))
         on conflict (code) do nothing
         returning expires_at`,
        [code, userId, QR_TTL_SECONDS],
      );
      if (rows[0]) return { code, expiresAt: new Date(rows[0].expires_at).toISOString() };
    }
    fail("Kod üretilemedi, tekrar dene.", 500);
  });
}

/** QR'dan veya elle girilen metinden 7 haneli kodu çıkarır ("TELVE:4187949", "TV 4187 · 949" …). */
export function extractCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return /^\d{7}$/.test(digits) ? digits : null;
}

type ValidCode = { user_id: string; expires_at: Date };

async function findValidCode(t: Queryable, code: string, lock: boolean): Promise<ValidCode> {
  const [row] = await t.query<ValidCode & { used_at: Date | null }>(
    `select user_id, expires_at, used_at from qr_codes where code = $1 ${lock ? "for update" : ""}`,
    [code],
  );
  if (!row) fail("Bu kod bulunamadı. Müşteriden QR'ı yenilemesini iste.", 404);
  if (row.used_at) fail("Bu QR zaten kullanıldı. Müşteriden yenisini açmasını iste.", 409);
  if (new Date(row.expires_at).getTime() <= Date.now()) fail("QR'ın süresi dolmuş. Müşteri ekranda yenisini göstersin.", 410);
  return row;
}

// ── Kasa ────────────────────────────────────────────────────────────────────

export type CustomerCard = {
  code: string;
  name: string;
  memberNo: string;
  stamps: number;
  goal: number;
  freeDrinks: number;
  expiresAt: string;
};

/** Kasiyer QR'ı okutunca: kodu harcamadan müşteriyi gösterir. */
export async function lookupCode(code: string): Promise<CustomerCard> {
  const q = await db();
  const row = await findValidCode(q, code, false);
  const [u] = await q.query<UserRow>("select * from users where id = $1", [row.user_id]);
  if (!u) fail("Hesap bulunamadı.", 404);
  return {
    code,
    name: u.name,
    memberNo: String(u.member_no).padStart(4, "0"),
    stamps: u.stamps,
    goal: GOAL,
    freeDrinks: u.free_drinks,
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

export type CheckoutResult = {
  name: string;
  added: number;
  redeemed: boolean;
  earned: number;
  before: number;
  stamps: number;
  goal: number;
  freeDrinks: number;
};

/**
 * Kasiyer onaylayınca: damgaları ekler / hediyeyi düşer ve kodu harcar.
 * Hepsi tek işlemde: iki kasa aynı kodu aynı anda okutsa bile sadece biri başarılı olur.
 */
export async function checkout(code: string, cashierId: string, coffees: number, redeem: boolean): Promise<CheckoutResult> {
  if (coffees === 0 && !redeem) fail("En az 1 kahve ekle ya da hediye kullan.");
  const q = await db();
  return q.tx(async (t) => {
    const row = await findValidCode(t, code, true);
    const [u] = await t.query<UserRow>("select * from users where id = $1 for update", [row.user_id]);
    if (!u) fail("Hesap bulunamadı.", 404);
    if (redeem && u.free_drinks < 1) fail("Bu müşterinin kullanılabilir hediye kahvesi yok.", 409);

    const total = u.stamps + coffees;
    const earned = Math.floor(total / GOAL);
    const stamps = total % GOAL;
    const freeDrinks = u.free_drinks - (redeem ? 1 : 0) + earned;

    await t.query(
      `update users set stamps = $2, free_drinks = $3, total_earned = total_earned + $4, total_coffees = total_coffees + $5
        where id = $1`,
      [u.id, stamps, freeDrinks, earned, coffees],
    );
    await t.query("update qr_codes set used_at = now() where code = $1", [code]);

    // Geçmiş: önce kullanılan hediye, sonra damga, en son (en yeni görünsün diye) kazanılan hediye.
    const log = (kind: TxRow["kind"], count: number) =>
      t.query("insert into transactions (user_id, cashier_id, kind, count) values ($1, $2, $3, $4)", [u.id, cashierId, kind, count]);
    if (redeem) await log("reward_used", 1);
    if (coffees > 0) await log("stamp", coffees);
    if (earned > 0) await log("reward_earned", earned);

    return { name: u.name, added: coffees, redeemed: redeem, earned, before: u.stamps, stamps, goal: GOAL, freeDrinks };
  });
}

export type KasaLogItem = { name: string; label: string; badge: string; time: string; free: boolean };

/** Kasiyerin bugün yaptığı işlemler. */
export async function cashierToday(cashierId: string): Promise<{ coffees: number; rewards: number; items: KasaLogItem[] }> {
  const q = await db();
  const rows = await q.query<TxRow & { name: string }>(
    `select t.kind, t.count, t.created_at, u.name
       from transactions t join users u on u.id = t.user_id
      where t.cashier_id = $1
        and t.created_at >= (date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul')
      order by t.created_at desc, t.id desc`,
    [cashierId],
  );
  const time = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
  return {
    coffees: rows.filter((r) => r.kind === "stamp").reduce((s, r) => s + r.count, 0),
    rewards: rows.filter((r) => r.kind === "reward_used").length,
    items: rows.slice(0, 20).map((r) => ({ name: r.name, ...historyLabel(r), time: time.format(new Date(r.created_at)) })),
  };
}
