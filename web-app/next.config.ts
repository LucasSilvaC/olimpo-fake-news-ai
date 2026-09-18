import type { NextConfig } from "next";

const isVercelBuild = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom", "undici"],
  poweredByHeader: false,
  // Next 16.3 + Vercel's build adapter does not emit the root NFT that the
  // standalone finalizer expects. Vercel does not need standalone output;
  // keep it for Docker/self-hosted builds only.
  ...(isVercelBuild ? {} : { output: "standalone" }),
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
