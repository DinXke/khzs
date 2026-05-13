import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [],
  },
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

export default nextConfig;
