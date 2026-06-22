// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://smart-clinic-three-tau.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: ["/admin/", "/patient/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
