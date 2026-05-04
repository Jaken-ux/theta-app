import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/journal"],
    },
    sitemap: "https://thetasimplified.com/sitemap.xml",
  };
}
