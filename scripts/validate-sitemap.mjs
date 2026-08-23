import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sax from "sax";
import { indexableRoutes, SITE_URL } from "../src/site-metadata.ts";

const distDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const sitemapPath = path.join(distDirectory, "sitemap.xml");
const errors = [];

const findHtmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findHtmlFiles(entryPath) : [entryPath];
  }));
  return files.flat().filter((file) => file.endsWith(".html"));
};

const parseSitemap = (xml) => {
  const urls = [];
  let rootSeen = false;
  let currentUrl;
  let activeField;

  const parser = sax.parser(true, { trim: false, normalize: false });
  parser.onerror = (error) => {
    throw error;
  };
  parser.onopentag = (node) => {
    if (!rootSeen) {
      rootSeen = true;
      if (node.name !== "urlset") {
        errors.push(`sitemap.xml: root element is ${node.name}, not urlset`);
      }
      if (node.attributes.xmlns !== "http://www.sitemaps.org/schemas/sitemap/0.9") {
        errors.push("sitemap.xml: sitemap protocol namespace is missing");
      }
    }

    if (node.name === "url") {
      currentUrl = { loc: "", lastmod: "" };
    } else if (currentUrl && (node.name === "loc" || node.name === "lastmod")) {
      activeField = node.name;
    }
  };
  parser.ontext = (text) => {
    if (currentUrl && activeField) currentUrl[activeField] += text;
  };
  parser.oncdata = (text) => {
    if (currentUrl && activeField) currentUrl[activeField] += text;
  };
  parser.onclosetag = (name) => {
    if (name === activeField) activeField = undefined;
    if (name === "url" && currentUrl) {
      urls.push({
        loc: currentUrl.loc.trim(),
        lastmod: currentUrl.lastmod.trim(),
      });
      currentUrl = undefined;
    }
  };
  parser.write(xml).close();

  if (!rootSeen) errors.push("sitemap.xml: root element is missing");
  return urls;
};

const sitemapXml = await readFile(sitemapPath, "utf8");
let sitemapUrls = [];
try {
  sitemapUrls = parseSitemap(sitemapXml);
} catch (error) {
  errors.push(`sitemap.xml: XML parse failed: ${error.message}`);
}

const sitemapByLocation = new Map();
for (const entry of sitemapUrls) {
  if (sitemapByLocation.has(entry.loc)) {
    errors.push(`sitemap.xml: duplicate URL: ${entry.loc}`);
  }
  sitemapByLocation.set(entry.loc, entry);

  try {
    const url = new URL(entry.loc);
    if (url.origin !== new URL(SITE_URL).origin || url.protocol !== "https:" || url.search || url.hash) {
      errors.push(`sitemap.xml: non-canonical URL: ${entry.loc}`);
    }
  } catch {
    errors.push(`sitemap.xml: invalid loc URL: ${entry.loc}`);
  }
  if (Number.isNaN(Date.parse(entry.lastmod))) {
    errors.push(`sitemap.xml: invalid lastmod for ${entry.loc}: ${entry.lastmod}`);
  }
}

const expectedByLocation = new Map(indexableRoutes.map((route) => [
  new URL(route.path, SITE_URL).href,
  route,
]));

for (const [location, route] of expectedByLocation) {
  const entry = sitemapByLocation.get(location);
  if (!entry) {
    errors.push(`sitemap.xml: missing indexable route: ${location}`);
  } else if (entry.lastmod !== route.lastModified) {
    errors.push(`sitemap.xml: lastmod mismatch for ${location}: ${entry.lastmod} != ${route.lastModified}`);
  }
}
for (const location of sitemapByLocation.keys()) {
  if (!expectedByLocation.has(location)) {
    errors.push(`sitemap.xml: unexpected route: ${location}`);
  }
}

const htmlFiles = await findHtmlFiles(distDirectory);
const indexableCanonicals = new Map();
for (const htmlFile of htmlFiles) {
  const relativePath = path.relative(distDirectory, htmlFile).replaceAll("\\", "/");
  const html = await readFile(htmlFile, "utf8");
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? "";
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];

  if (robots.split(",").map((value) => value.trim()).includes("noindex")) {
    if (canonical && sitemapByLocation.has(canonical)) {
      errors.push(`${relativePath}: noindex canonical is present in sitemap: ${canonical}`);
    }
    continue;
  }
  if (!canonical) {
    errors.push(`${relativePath}: indexable page has no canonical URL`);
    continue;
  }
  if (indexableCanonicals.has(canonical)) {
    errors.push(`${relativePath}: duplicate canonical also used by ${indexableCanonicals.get(canonical)}`);
  }
  indexableCanonicals.set(canonical, relativePath);

  const sitemapEntry = sitemapByLocation.get(canonical);
  if (!sitemapEntry) {
    errors.push(`${relativePath}: canonical is missing from sitemap: ${canonical}`);
  }

  const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  const article = schemas.find((schema) => schema["@type"] === "Article");
  if (article && sitemapEntry?.lastmod !== article.dateModified) {
    errors.push(`${relativePath}: Article dateModified and sitemap lastmod differ`);
  }
}

for (const location of expectedByLocation.keys()) {
  if (!indexableCanonicals.has(location)) {
    errors.push(`route metadata has no indexable generated page: ${location}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated sitemap XML with ${sitemapUrls.length} unique canonical URLs and stable lastmod values.`);
}
