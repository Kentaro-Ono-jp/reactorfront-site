import type { APIRoute } from "astro";
import { indexableRoutes, SITE_URL } from "../site-metadata";

const escapeXml = (value: string): string => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

export const GET: APIRoute = ({ site }) => {
  const canonicalSite = site ?? new URL(SITE_URL);
  if (canonicalSite.href !== SITE_URL) {
    throw new Error(`Astro site URL (${canonicalSite.href}) does not match SITE_URL (${SITE_URL}).`);
  }

  const urls = indexableRoutes.map((route) => [
    "  <url>",
    `    <loc>${escapeXml(new URL(route.path, canonicalSite).href)}</loc>`,
    `    <lastmod>${escapeXml(route.lastModified)}</lastmod>`,
    "  </url>",
  ].join("\n")).join("\n");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
