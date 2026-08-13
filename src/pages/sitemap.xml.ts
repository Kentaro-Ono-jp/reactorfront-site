import type { APIRoute } from "astro";

const routes = ["/", "/profile/", "/portfolio/", "/portfolio/aws/", "/infrastructure/"];

export const GET: APIRoute = ({ site }) => {
  const urls = routes
    .map((route) => `<url><loc>${new URL(route, site).href}</loc></url>`)
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
