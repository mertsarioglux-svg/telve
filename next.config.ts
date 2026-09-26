import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite WASM dosyalarını paketlemeden, node_modules'tan yüklesin.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
