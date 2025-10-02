/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Parse allowed origins from env
    const list = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    // If empty, you can default to "*" while testing (but prefer explicit origins in prod)
    const allowOrigin = list.length ? list : ["*"];

    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Accept" },
          // NOTE: Next.js can't emit multiple headers of same key easily,
          // so for multiple origins you typically handle via middleware (see Option 2).
          { key: "Access-Control-Allow-Origin", value: allowOrigin[0] || "*" }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
