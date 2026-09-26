// Türkçe tarih ve geçmiş satırı biçimleri ("Bugün 09:14 · Merkez", "MART 2025'TEN BERİ" …).

const TZ = "Europe/Istanbul";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const clock = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dayMonth = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, day: "2-digit", month: "short" });
const monthYear = new Intl.DateTimeFormat("tr-TR", { timeZone: TZ, month: "long", year: "numeric" });

export function historyMeta(date: Date, now: Date, suffix: string): string {
  const d = new Date(date);
  const days = Math.round((Date.parse(dayKey.format(now)) - Date.parse(dayKey.format(d))) / 864e5);
  const when = days === 0 ? `Bugün ${clock.format(d)}` : days === 1 ? `Dün ${clock.format(d)}` : dayMonth.format(d).replace(".", "");
  return `${when} · ${suffix}`;
}

export function historyLabel(t: { kind: string; count: number }): { label: string; badge: string; free: boolean } {
  switch (t.kind) {
    case "reward_earned":
      return { label: "Kart tamamlandı", badge: `+${t.count} HEDİYE`, free: true };
    case "reward_used":
      return { label: "Hediye kahve kullanıldı", badge: "HEDİYE", free: true };
    default:
      return { label: t.count > 1 ? `${t.count} kahve okutuldu` : "Kahve okutuldu", badge: `+${t.count} DAMGA`, free: false };
  }
}

// Yıldan sonra gelen "-den/-dan/-ten/-tan" eki, yılın okunuşundaki son kelimeye göre değişir.
const ONES = ["", "den", "den", "ten", "ten", "ten", "dan", "den", "den", "dan"]; // bir iki üç dört beş altı yedi sekiz dokuz
const TENS = ["den", "dan", "den", "dan", "tan", "den", "tan", "ten", "den", "dan"]; // (bin) on yirmi otuz kırk elli altmış yetmiş seksen doksan

function ablative(year: number): string {
  const ones = year % 10;
  if (ones) return ONES[ones];
  const tens = Math.floor(year / 10) % 10;
  return tens ? TENS[tens] : "den"; // 2000 → "bin"den
}

/** "MART 2025'TEN BERİ" */
export function memberSince(date: Date): string {
  const [month, year] = monthYear.format(date).split(" ");
  return `${month} ${year}'${ablative(Number(year))} BERİ`.toLocaleUpperCase("tr-TR");
}
