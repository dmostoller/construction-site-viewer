import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        cesium: "./node_modules/cesium",
      },
    },
  },

  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/static/:path*",
        destination: "/public/static/:path*",
      },
    ];
  },
};

export default nextConfig;
