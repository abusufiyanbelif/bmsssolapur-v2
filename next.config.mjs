/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This is the correct way to handle server-only packages in Next.js.
    // It tells webpack to not bundle 'firebase-admin' for the client-side.
    if (!isServer) {
      config.externals.push('firebase-admin');
    }

    // This part handles the .wasm module issue if it ever arises again.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    
    return config;
  },
};

export default nextConfig;
