import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/',
        destination: '/todos',
        permanent: true, // or false for temporary redirect (307)
      },
    ];
  },
};

export default nextConfig;
