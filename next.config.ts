import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  async redirects() {
    return [
      {
        source: "/perfil/:path*",
        destination: "/garage/:path*",
        permanent: true,
      },
      {
        source: "/feed/:path*",
        destination: "/autopista/:path*",
        permanent: true,
      },
      {
        source: "/api/profile/:path*",
        destination: "/api/garage/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
