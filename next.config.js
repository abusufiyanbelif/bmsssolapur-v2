
/** @type {import('next').NextConfig} */
const nextConfig = {
  devSwitches: {
    appServerTracing: true,
  },
  experimental: {
    allowedDevOrigins: [
        "https://*.google.com",
        "https://*.cloud.google.com",
        "https://*.firebase.google.com",
        "https://*.corp.google.com",
        "https://*.cloud.goog",
        "https://*.cloudworkstations.dev",
        "https://*.firebase.dev",
        "https://*.web.app",
        "https://*.firebaseapp.com",
    ]
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
        hostname: 'storage.googleapis.com',
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
        hostname: 'assets.dev.braze.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
