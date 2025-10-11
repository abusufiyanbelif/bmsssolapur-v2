
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, "handlebars"];
    }
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
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
        hostname: 'assets.dev.braze.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
