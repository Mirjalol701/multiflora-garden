import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/catalog`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/plan`, lastModified, changeFrequency: "monthly", priority: 0.88 },
    { url: `${siteUrl}/garden`, lastModified, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/services`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/contacts`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/login`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];

  return staticPages;
}
