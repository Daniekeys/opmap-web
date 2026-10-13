import type { NextConfig } from "next";

// Read when the config loads: by `next dev`, and by `next build`, which writes
// the rewrite into the build output. So API_URL has to be set at build time.
const apiUrl = process.env.API_URL?.replace(/\/$/, "");
if (!apiUrl) {
  throw new Error("API_URL is not set. Copy .env.example to .env.local, or set it on the service.");
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The browser only ever talks to this origin. /api/* is forwarded to
  // opmap-api, so the Better Auth cookie is same-origin and there is no CORS.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
