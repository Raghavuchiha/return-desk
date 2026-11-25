/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";

    return [
      {
        source: "/api/returns/:path*",
        destination: `${backendUrl}/api/returns/:path*`,
      },
    ];
  },
};

export default nextConfig;