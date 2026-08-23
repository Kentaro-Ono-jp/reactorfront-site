import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDirectory = fileURLToPath(new URL("../dist/", import.meta.url));

const findHtmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? findHtmlFiles(entryPath) : [entryPath];
    }),
  );
  return files.flat().filter((file) => file.endsWith(".html"));
};

const htmlFiles = await findHtmlFiles(distDirectory);
const errors = [];
let jsonLdCount = 0;
let breadcrumbCount = 0;

for (const htmlFile of htmlFiles) {
  const relativePath = path.relative(distDirectory, htmlFile).replaceAll("\\", "/");
  const html = await readFile(htmlFile, "utf8");
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
  const hasVisibleBreadcrumbs = html.includes('aria-label="パンくずリスト"');
  const schemas = [];
  const scriptPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    jsonLdCount += 1;
    try {
      schemas.push(JSON.parse(match[1]));
    } catch (error) {
      errors.push(`${relativePath}: JSON-LDをparseできません: ${error.message}`);
    }
  }

  const breadcrumbSchemas = schemas.filter((schema) => schema["@type"] === "BreadcrumbList");

  if (hasVisibleBreadcrumbs && breadcrumbSchemas.length !== 1) {
    errors.push(`${relativePath}: 画面上のパンくずに対するBreadcrumbListが1件ではありません`);
  }
  if (!hasVisibleBreadcrumbs && breadcrumbSchemas.length > 0) {
    errors.push(`${relativePath}: 画面上にないBreadcrumbListが出力されています`);
  }

  for (const breadcrumb of breadcrumbSchemas) {
    breadcrumbCount += 1;
    const items = breadcrumb.itemListElement;
    if (!Array.isArray(items) || items.length < 2) {
      errors.push(`${relativePath}: BreadcrumbListには2件以上のListItemが必要です`);
      continue;
    }

    items.forEach((item, index) => {
      if (item?.["@type"] !== "ListItem") {
        errors.push(`${relativePath}: パンくず${index + 1}件目の@typeがListItemではありません`);
      }
      if (item?.position !== index + 1) {
        errors.push(`${relativePath}: パンくず${index + 1}件目のpositionが不正です`);
      }
      if (typeof item?.name !== "string" || item.name.length === 0) {
        errors.push(`${relativePath}: パンくず${index + 1}件目のnameがありません`);
      }
      try {
        const itemUrl = new URL(item?.item);
        if (itemUrl.protocol !== "https:") throw new Error("HTTPSではありません");
      } catch {
        errors.push(`${relativePath}: パンくず${index + 1}件目のitemが有効なHTTPS URLではありません`);
      }
    });

    const finalItem = items.at(-1)?.item;
    if (canonicalMatch && finalItem !== canonicalMatch[1]) {
      errors.push(`${relativePath}: 最終パンくずとcanonical URLが一致しません`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${jsonLdCount} JSON-LD blocks across ${htmlFiles.length} HTML files (${breadcrumbCount} BreadcrumbList items).`);
}
