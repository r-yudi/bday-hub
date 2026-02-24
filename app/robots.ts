import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/debug", "/debug/*"]
      }
    ],
    sitemap: "https://uselembra.com.br/sitemap.xml"
  };
}
