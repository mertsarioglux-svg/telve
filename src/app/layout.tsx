import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Telve",
  description: "Telve Kahve sadakat kartı — her 10 kahvede 1 kahve bizden.",
  appleWebApp: { capable: true, title: "Telve", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#182F20",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
