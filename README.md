# Telve — Kahve Sadakat Uygulaması

Her 10 kahvede 1 kahve bizden. Müşteri telefonunda QR'ını gösterir, barista kasada okutur, damga anında hesaba düşer.

- **Müşteri uygulaması** (`/`): kayıt/giriş, sadakat kartı (fincan halkası), QR pasosu, ödüller, şube, profil, KVKK, hesap silme
- **Kasa** (`/kasa`): kamerayla QR okutma (ya da kodu elle girme), kahve adedi, hediye kullanma, günlük işlem listesi
- **PWA**: telefonda "Ana ekrana ekle" ile uygulama gibi açılır; App Store gerekmez

Tasarım: Claude Design "Telve App" (Modernist tasarım sistemi, Archivo yazı tipi).

## Nasıl çalışıyor?

```
 Müşteri telefonu                    Sunucu (Next.js API)                 Kasa (telefon/tablet)
 ────────────────                    ────────────────────                 ─────────────────────
 QR KODUMU GÖSTER ──POST /api/qr──▶  7 haneli rastgele kod üret,
                                     60 sn geçerli, müşteriye bağla
 QR'da sadece "TELVE:4187949" ◀──────
                                                                          Kamera QR'ı okur
                                     kod geçerli mi? kimin? ◀──lookup──── 
                                     ──────────────────────────────────▶  Ayşe · 9/10 · 1 hediye
                                                                          adet seç → ONAYLA
                                     tek işlemde: damga ekle,  ◀─checkout─
                                     10'a ulaştıysa hediye ver,
                                     kodu "kullanıldı" işaretle
 2 sn'de bir /api/me yoklar ────────▶
 değişiklik → "Bir kahve bizden." 🎉
```

**Güvenlik kararları** (sunumda anlatmaya değer):

- QR'da müşterinin kimliği yok; sadece 60 sn geçerli, **tek kullanımlık** bir kod var. Ekran görüntüsü işe yaramaz.
- Damga ekleme ve hediye verme kuralları **sunucuda** çalışır. Uygulama "10'a ulaştım" diyemez; sunucu hesaplar.
- Okutma işlemi tek bir veritabanı işleminde (transaction) yapılır. İki kasa aynı kodu aynı anda okutsa bile sadece biri geçer.
- Sadece `kasiyer` rolündeki hesaplar kasa API'lerini kullanabilir. Müşteri kendine damga ekleyemez.
- Şifreler scrypt ile özetlenerek saklanır. Oturum ve sıfırlama belirteçlerinin de sadece SHA-256 özeti veritabanında durur.

## Bilgisayarda çalıştırma

```bash
npm install
npm run dev
```

http://localhost:3000 adresini aç. Veritabanı kurmana gerek yok: `DATABASE_URL` boşken proje, `.data/` klasöründe gömülü bir Postgres (PGlite) kullanır.

### Demo hesapları

`.env.local` içinde `DEMO_PASSWORD` tanımlıysa sunucu ilk açıldığında şu hesaplar oluşur (şifreleri `DEMO_PASSWORD`):

| E-posta | Rol | Durum |
|---|---|---|
| `kasiyer@telve.test` | kasiyer | Giriş yapınca doğrudan `/kasa` açılır |
| `ayse@telve.test` | müşteri | 9/10 damga, 1 hediye. Tek okutmada kutlama ekranı çıkar |
| `mehmet@telve.test` | müşteri | 3/10 damga |

Sunumdan önce demo hesaplarını ilk hâline döndürmek için:

```bash
npm run seed
```

> Yerel veritabanında bunu çalıştırmadan önce `npm run dev`i durdur (aynı veritabanı dosyasını iki işlem açamaz).

### Telefonla aynı Wi-Fi'da deneme

Tarayıcılar kamerayı sadece HTTPS'te açar. Kasayı telefonda denemek için:

```bash
npm run dev:https
```

Telefondan `https://<bilgisayarın-yerel-ip'si>:3000` adresini aç ve sertifika uyarısını geç. En kolayı yine de aşağıdaki gibi Vercel'e yüklemek.

Şifre sıfırlama e-postaları: `RESEND_API_KEY` yoksa bağlantı terminale yazılır.

## Yayına alma (ücretsiz)

1. **Veritabanı**: [supabase.com](https://supabase.com)'da ücretsiz proje aç. *Connect → Transaction pooler* bağlantı adresini kopyala (port 6543). Tablolar ilk istekte otomatik oluşur. Neon da olur.
2. **GitHub**: projeyi bir repoya yükle.
3. **Vercel**: [vercel.com](https://vercel.com)'da repoyu içe aktar. *Environment Variables* bölümüne ekle:
   - `DATABASE_URL`: 1. adımdaki adres
   - `DEMO_PASSWORD`: demo hesaplarının şifresi
   - (isteğe bağlı) `RESEND_API_KEY`, `MAIL_FROM`
4. Deploy. Sana verilen `https://….vercel.app` adresini telefonda aç, *Paylaş → Ana Ekrana Ekle*.

> Vercel'de dosya sistemi salt okunur olduğu için gömülü veritabanı çalışmaz; yayında `DATABASE_URL` şarttır.

## Proje yapısı

```
src/
  app/
    page.tsx               müşteri uygulaması (oturum yoksa giriş akışı)
    kasa/page.tsx          kasa (sadece kasiyer)
    sifre-yenile/          e-postadaki bağlantının açtığı sayfa
    api/
      auth/…               kayıt, giriş, çıkış, şifremi unuttum, sıfırla
      me/                  müşteri özeti, bildirim tercihleri, hesabı sil
      qr/                  tek kullanımlık QR kodu üret
      kasa/…               lookup (kodu çöz), checkout (damga/hediye), today
    manifest.ts            PWA manifesti
  components/
    auth/                  karşılama, giriş, kayıt, şifre ekranları
    app/                   sekmeler, QR pasosu, kutlama, bildirimler, hesap silme
    kasa/                  kasa ekranı ve kamera okuyucu
  lib/
    loyalty.ts             ⭐ iş kuralları: 10'da 1 hediye, QR üretme/doğrulama, checkout
    schema.ts              veritabanı tabloları
    db.ts                  Postgres / gömülü PGlite bağlantısı
    auth.ts, crypto.ts     oturum çerezleri, şifre özetleme
    validation.ts          form kuralları (tarayıcı ve sunucu aynı kuralı kullanır)
    store.ts               şube adresi, saatleri, telefonu
```

Şube telefonu `src/lib/store.ts` içinde boş bırakıldı. Doldurulunca Şube sekmesinde **ARA** düğmesi görünür.
