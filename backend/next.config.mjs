// backend/next.config.mjs
import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // keep any experimental flags you already had
  },

  // because your repo has multiple lockfiles (frontend + backend)
  outputFileTracingRoot: path.join(__dirname, ".."),

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // :point_down: list every Webflow origin you'll call from
          { key: "Access-Control-Allow-Origin", value: "https://paylatertravel-au.webflow.io" },
          // add your custom domain if you have one, one rule per origin:
          // { key: "Access-Control-Allow-Origin", value: "https://www.yourdomain.com" },

          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Accept" },
          // only keep this if you actually include credentials (cookies/auth headers) from Webflow
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Vary", value: "Origin" }
        ],
      },
    ];
  },
};

export default nextConfig;