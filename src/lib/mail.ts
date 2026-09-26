// Şifre sıfırlama e-postası. RESEND_API_KEY yoksa (yerelde / demo) bağlantı sunucu konsoluna yazılır.

export async function sendResetMail(to: string, link: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[telve] Şifre sıfırlama bağlantısı (${to}):\n${link}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Telve <onboarding@resend.dev>",
      to,
      subject: "Telve · Şifreni yenile",
      text: `Merhaba,\n\nTelve şifreni yenilemek için bağlantıya dokun (1 saat geçerli):\n${link}\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.`,
    }),
  });
  if (!res.ok) console.error("[telve] E-posta gönderilemedi:", res.status, await res.text());
}
