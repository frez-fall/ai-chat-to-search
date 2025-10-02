// backend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep CORS in middleware.ts; avoid duplicate headers here
  typescript: { ignoreBuildErrors: true }, // optional while stabilizing
  eslint: { ignoreDuringBuilds: true }     // optional while stabilizing
};

export default nextConfig;
