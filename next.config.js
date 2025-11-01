/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Workaround for native optional "ws" dependencies used by some libraries
  // (e.g. ethers -> ws -> bufferutil). Prevent webpack from trying to bundle
  // native optional dependencies into the client build which can fail on Vercel/Windows.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = Object.assign({}, config.resolve.fallback || {}, {
        bufferutil: false,
        'utf-8-validate': false,
      })
    }
    return config
  },
};

module.exports = nextConfig;
