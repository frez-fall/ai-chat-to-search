// backend/next.config.mjs
import { fileURLToPath } from "node:url";
import path from "node:path";
// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** @type {import('next').NextConfig} */
const nextConfig = {
  // This quiets the “multiple lockfiles” warning; safe to keep or remove.
  outputFileTracingRoot: path.join(__dirname, ".."),
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // :point_down: static CORS for your Webflow site (add more blocks for more origins)
          { key: "Access-Control-Allow-Origin", value: "https://paylatertravel-au.webflow.io" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Accept" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Vary", value: "Origin" }
        ]
      }
    ];
  }
};
export default nextConfig;