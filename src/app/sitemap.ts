import type { MetadataRoute } from "next";
import { listPublic } from "@/lib/db";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await listPublic();
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    ...listings.map((l) => ({
      url: `${site.url}/plots/${l.id}`,
      lastModified: new Date(l.updated_at.replace(" ", "T") + "Z"),
      priority: 0.8,
    })),
  ];
}
