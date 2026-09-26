import { Logo } from "./Logo";
import { ArrowLeft } from "./icons";

/** Tam ekran alt sayfa: yeşil üst bar (GERİ + TELVE) ve kâğıt zemin. */
export function Sheet({ onBack, children, z = 95 }: { onBack: () => void; children: React.ReactNode; z?: number }) {
  return (
    <div className="overlay rise" style={{ zIndex: z, background: "var(--paper)", color: "var(--ink)" }}>
      <div className="topbar">
        <button className="back" onClick={onBack}>
          <ArrowLeft size={16} width={2} />
          GERİ
        </button>
        <div className="brand" style={{ gap: 8, fontSize: 14 }}>
          <Logo size={22} />
          TELVE
        </div>
      </div>
      <div className="scroll">{children}</div>
    </div>
  );
}

const KVKK: [string, string][] = [
  [
    "1 · VERİ SORUMLUSU",
    "Telve Kahve (Kazım Karabekir Cd. No 21 D:2A, Hızırpaşa, Amasya), kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu sıfatıyla işler.",
  ],
  [
    "2 · İŞLENEN VERİLER",
    "Ad soyad, telefon numarası, e-posta adresi, şifre (şifrelenmiş olarak), damga ve hediye kahve geçmişi, işlem yapılan şube ve zaman bilgisi.",
  ],
  [
    "3 · İŞLEME AMAÇLARI",
    "Üyelik hesabının oluşturulması ve yönetimi, sadakat programı kapsamında damga ve hediyelerin takibi, müşteri destek taleplerinin yanıtlanması, yasal yükümlülüklerin yerine getirilmesi. Açık rızanız olması hâlinde kampanya bildirimleri gönderilmesi.",
  ],
  [
    "4 · HUKUKİ SEBEP VE AKTARIM",
    "Verileriniz sözleşmenin kurulması ve ifası ile meşru menfaat hukuki sebeplerine dayanarak işlenir; yalnızca barındırma ve SMS / e-posta hizmeti aldığımız tedarikçilerle ve yetkili kamu kurumlarıyla, gerektiği ölçüde paylaşılır.",
  ],
  [
    "5 · HAKLARINIZ",
    "KVKK 11. madde uyarınca verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme ve işlemeye itiraz etme haklarına sahipsiniz. Hesabınızı uygulamadaki Profil › Hesabı sil adımıyla dilediğiniz an silebilirsiniz.",
  ],
];

/** KVKK aydınlatma metni. Kayıt sırasında açılırsa altta "kabul ediyorum" düğmesi çıkar. */
export function KvkkSheet({ onBack, onAccept }: { onBack: () => void; onAccept?: () => void }) {
  return (
    <Sheet onBack={onBack}>
      <div className="rule-b" style={{ padding: "22px 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="kicker">6698 SAYILI KANUN</span>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.02 }}>KVKK Aydınlatma Metni</span>
      </div>
      <div style={{ padding: "18px 20px 8px", display: "flex", flexDirection: "column", gap: 18, fontSize: 13, fontWeight: 500, lineHeight: 1.55 }}>
        {KVKK.map(([head, text]) => (
          <div key={head} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".18em", color: "var(--telve)" }}>{head}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
      {onAccept ? (
        <div className="rule" style={{ marginTop: 14, padding: "18px 20px 40px" }}>
          <button className="btn btn-green" onClick={onAccept}>
            OKUDUM, KABUL EDİYORUM
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12l5 5L20 6" />
            </svg>
          </button>
        </div>
      ) : (
        <div style={{ height: 34 }} />
      )}
    </Sheet>
  );
}
