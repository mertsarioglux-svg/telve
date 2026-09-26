import type { MetadataRoute } from "next";

// "Ana ekrana ekle" dendiğinde uygulama gibi açılması için PWA manifesti.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Telve",
    short_name: "Telve",
    description: "Her 10 kahvede 1 kahve bizden.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#182F20",
    theme_color: "#182F20",
    lang: "tr",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
