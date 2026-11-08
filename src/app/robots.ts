import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawlers may read the landing page and the privacy page, nothing else.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy"],
      disallow: ["/start", "/w/", "/workspaces/", "/login", "/invite/", "/auth/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
