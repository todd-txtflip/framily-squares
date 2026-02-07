/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true, // Also ignore TypeScript errors if needed
    }
  }
  
  module.exports = nextConfig