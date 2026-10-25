import type { NextConfig } from "next";

// macOS writes "._*" metadata files on exFAT/external drives, which corrupt Turbopack's
// on-disk cache. Skip the cache there; normal servers keep the faster cached builds.
const onExternalDrive = process.platform === "darwin" && process.cwd().startsWith("/Volumes/");

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "sharp"],
  poweredByHeader: false,
  // Let `npm run dev` work through an ngrok tunnel (no effect in production builds).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.dev"],
  experimental: {
    turbopackFileSystemCacheForDev: !onExternalDrive,
    turbopackFileSystemCacheForBuild: !onExternalDrive,
  },
};

export default nextConfig;
