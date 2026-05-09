/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    proxyClientMaxBodySize: "500mb",
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  async headers() {
    return [
      {
        // Scope CSP to project detail pages only to allow YouTube blobs
        source: "/projects/:slug*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://apis.google.com https://ssl.gstatic.com https://www.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://*.youtube.com https://*.google.com https://*.gstatic.com https://youtube.com https://www.youtube.com https://www.youtube-nocookie.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' https://www.googleapis.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
