/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // pdf-parse and bullmq are server-only; keep them out of the client bundle.
    serverComponentsExternalPackages: ["pdf-parse", "bullmq", "ioredis", "@prisma/client", "bcryptjs"],
  },
};

export default nextConfig;
