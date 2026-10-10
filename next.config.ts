import type { NextConfig } from 'next';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: cloudName ? `/${cloudName}/**` : '/**',
      },
    ],
  },
};

export default nextConfig;
