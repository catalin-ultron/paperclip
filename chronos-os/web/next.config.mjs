/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/ws",
        headers: [
          { key: "Upgrade", value: "websocket" },
          { key: "Connection", value: "Upgrade" },
        ],
      },
    ];
  },
};

export default nextConfig;
