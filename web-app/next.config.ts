import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom", "undici"],
  poweredByHeader: false,
};

export default nextConfig;
