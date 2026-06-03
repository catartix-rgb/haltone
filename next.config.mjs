/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow workers and large image processing
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  // Headers for SharedArrayBuffer / cross-origin isolation (future WebGPU/threads)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ]
  },
  webpack: (config) => {
    // Web worker support
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader' },
    })
    return config
  },
}

export default nextConfig
