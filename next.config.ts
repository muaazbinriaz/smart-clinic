import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "ui-avatars.com" }],
  },
  allowedDevOrigins: ["192.168.100.109"],
  devIndicators: false,
};

export default nextConfig;
