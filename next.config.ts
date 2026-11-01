import type { NextConfig } from "next";

// cacheComponents sengaja tidak diaktifkan: setiap halaman membaca sesi dari cookie
// dan data antrian diambil ulang lewat polling, jadi render dinamis biasa lebih sederhana.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
