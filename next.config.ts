import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.minimumtostart.com" }],
        destination: "https://minimumtostart.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
