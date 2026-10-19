/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
      // Désactive les erreurs ESLint pendant le build sur Vercel
      ignoreDuringBuilds: true,
    },
    typescript: {
      // Ignore aussi les erreurs TypeScript si besoin
      ignoreBuildErrors: true,
    },
  }
  
  module.exports = nextConfig