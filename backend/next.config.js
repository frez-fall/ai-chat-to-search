/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true }, // optional while stabilizing
  eslint: { ignoreDuringBuilds: true }     // optional while stabilizing
};

module.exports = nextConfig;
