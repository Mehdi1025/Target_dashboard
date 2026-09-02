import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Évite que Turbopack remonte au mauvais dossier (package-lock hors repo)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
