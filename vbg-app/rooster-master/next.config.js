/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '31.97.144.132',
        port: '4000',
        pathname: '/uploads/**',
      },
    ],
  },
}

export default nextConfig
