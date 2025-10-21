/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    
    // This is the correct way to mark server-only modules
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            'firebase-admin': false,
        };
    }
    
    config.externals.push('firebase-admin');

    return config;
  },
};

export default nextConfig;
