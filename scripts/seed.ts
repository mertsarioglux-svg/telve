// Demo hesaplarını baştan kurar (Ayşe 9/10, Mehmet 3/10, kasiyer).
// Kullanım:  npm run seed
// Yerel veritabanında çalıştırmadan önce `npm run dev`i durdur (aynı dosyayı iki işlem açamaz).
import { db } from "../src/lib/db";
import { DEMO_USERS, seedDemo } from "../src/lib/seed";

const pw = process.env.DEMO_PASSWORD;
if (!pw) {
  console.error("DEMO_PASSWORD tanımlı değil. .env.local dosyasına ekle.");
  process.exit(1);
}

async function main(password: string) {
  await seedDemo(await db(), password, true);
  console.log("Demo hesapları sıfırlandı:");
  for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(8)} ${u.email}`);
  console.log("Şifre: .env.local içindeki DEMO_PASSWORD");
}

main(pw).then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
