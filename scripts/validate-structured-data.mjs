import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { indexableRoutes } from "../src/site-metadata.ts";

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
let articleCount = 0;

const expectedArticlePaths = new Set(indexableRoutes
  .filter((route) => "datePublished" in route)
  .map((route) => route.path === "/" ? "index.html" : `${route.path.slice(1)}index.html`));
const representativeImages = new Map();

const hasType = (schema, type) => {
  const types = Array.isArray(schema?.["@type"]) ? schema["@type"] : [schema?.["@type"]];
  return types.includes(type);
};

const collectTypedNodes = (value, type, nodes = []) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectTypedNodes(item, type, nodes));
  } else if (value && typeof value === "object") {
    if (hasType(value, type)) nodes.push(value);
    Object.values(value).forEach((item) => collectTypedNodes(item, type, nodes));
  }
  return nodes;
};

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

  const organizations = schemas.filter((schema) => hasType(schema, "ProfessionalService"));
  const websites = schemas.filter((schema) => hasType(schema, "WebSite"));
  const expectedBrandAliases = ["リアクターフロント", "reactorfront"];

  if (organizations.length !== 1) {
    errors.push(`${relativePath}: ProfessionalServiceが1件ではありません`);
  } else {
    const organization = organizations[0];
    const aliases = Array.isArray(organization.alternateName)
      ? organization.alternateName
      : [organization.alternateName];
    if (organization["@id"] !== "https://www.reactorfront.jp/#organization") {
      errors.push(`${relativePath}: ProfessionalService @idが不正です`);
    }
    if (organization.name !== "ReactorFront" || organization.legalName !== "リアクターフロント") {
      errors.push(`${relativePath}: ProfessionalServiceの正式名または屋号が不正です`);
    }
    if (JSON.stringify(aliases) !== JSON.stringify(expectedBrandAliases)) {
      errors.push(`${relativePath}: ProfessionalService alternateNameの内容または優先順が不正です`);
    }
  }

  if (websites.length !== 1) {
    errors.push(`${relativePath}: WebSiteが1件ではありません`);
  } else {
    const website = websites[0];
    const aliases = Array.isArray(website.alternateName)
      ? website.alternateName
      : [website.alternateName];
    if (website["@id"] !== "https://www.reactorfront.jp/#website") {
      errors.push(`${relativePath}: WebSite @idが不正です`);
    }
    if (website.name !== "ReactorFront") {
      errors.push(`${relativePath}: WebSite nameがReactorFrontではありません`);
    }
    if (JSON.stringify(aliases) !== JSON.stringify(expectedBrandAliases)) {
      errors.push(`${relativePath}: WebSite alternateNameの内容または優先順が不正です`);
    }
    if (website.publisher?.["@id"] !== "https://www.reactorfront.jp/#organization") {
      errors.push(`${relativePath}: WebSite publisherがReactorFrontの事業者nodeではありません`);
    }
  }

  const breadcrumbSchemas = schemas.filter((schema) => hasType(schema, "BreadcrumbList"));

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

  const articleSchemas = schemas.filter((schema) => hasType(schema, "Article"));
  for (const article of articleSchemas) {
    articleCount += 1;
    const canonical = canonicalMatch?.[1];
    const images = Array.isArray(article.image) ? article.image : [article.image];
    if (article.url !== canonical || article.mainEntityOfPage?.["@id"] !== `${canonical}#webpage`) {
      errors.push(`${relativePath}: Article URL、mainEntityOfPage、canonicalが一致しません`);
    }
    if (typeof article.headline !== "string" || article.headline.length === 0) {
      errors.push(`${relativePath}: Article headlineがありません`);
    }
    if (typeof article.description !== "string" || article.description.length === 0) {
      errors.push(`${relativePath}: Article descriptionがありません`);
    }
    if (article.author?.["@id"] !== "https://www.reactorfront.jp/#kentaro-ono" || article.author?.name !== "小野賢太郎") {
      errors.push(`${relativePath}: Article authorが共通Personではありません`);
    }
    if (article.publisher?.["@id"] !== "https://www.reactorfront.jp/#organization") {
      errors.push(`${relativePath}: Article publisherがReactorFrontではありません`);
    }
    for (const property of ["datePublished", "dateModified"]) {
      if (typeof article[property] !== "string" || Number.isNaN(Date.parse(article[property]))) {
        errors.push(`${relativePath}: Article ${property}が有効な日付ではありません`);
      }
      if (!html.includes(`datetime="${article[property]}"`)) {
        errors.push(`${relativePath}: 画面上にArticle ${property}がありません`);
      }
    }
    if (Date.parse(article.datePublished) > Date.parse(article.dateModified)) {
      errors.push(`${relativePath}: Article dateModifiedがdatePublishedより前です`);
    }
    if (!Array.isArray(images) || images.length === 0 || images.some((image) => typeof image !== "string" || !image.startsWith("https://"))) {
      errors.push(`${relativePath}: Article imageが有効なHTTPS URLではありません`);
    } else {
      const primaryImage = images[0];
      const previousOwner = representativeImages.get(primaryImage);
      if (previousOwner) {
        errors.push(`${relativePath}: Article代表画像が${previousOwner}と重複しています`);
      } else {
        representativeImages.set(primaryImage, relativePath);
      }
      const imagePath = new URL(primaryImage).pathname;
      if (!html.includes(`src="${imagePath}"`)) {
        errors.push(`${relativePath}: Article代表画像が画面上にありません`);
      }
    }
    if (!html.includes('href="/profile/" rel="author"')) {
      errors.push(`${relativePath}: 画面上に著者プロフィールへのリンクがありません`);
    }
    if (!html.includes('<meta property="og:type" content="article">')) {
      errors.push(`${relativePath}: Articleページのog:typeがarticleではありません`);
    }
  }

  if (expectedArticlePaths.has(relativePath) && articleSchemas.length !== 1) {
    errors.push(`${relativePath}: Articleが1件ではありません`);
  }
  if (!expectedArticlePaths.has(relativePath) && articleSchemas.length > 0) {
    errors.push(`${relativePath}: Article対象外ページにArticleが出力されています`);
  }

  if (relativePath === "profile/index.html") {
    const profilePages = schemas.filter((schema) => hasType(schema, "ProfilePage"));
    if (profilePages.length !== 1) {
      errors.push(`${relativePath}: ProfilePageが1件ではありません`);
    } else {
      const person = profilePages[0].mainEntity;
      const alternateNames = Array.isArray(person?.alternateName) ? person.alternateName : [person?.alternateName];
      const sameAs = Array.isArray(person?.sameAs) ? person.sameAs : [person?.sameAs];
      if (person?.["@id"] !== "https://www.reactorfront.jp/#kentaro-ono") {
        errors.push(`${relativePath}: ProfilePage mainEntityのPerson @idが不正です`);
      }
      if (person?.name !== "小野賢太郎") {
        errors.push(`${relativePath}: Person nameが小野賢太郎ではありません`);
      }
      for (const expectedName of ["小野 賢太郎", "Kentaro Ono"]) {
        if (!alternateNames.includes(expectedName)) {
          errors.push(`${relativePath}: Person alternateNameに${expectedName}がありません`);
        }
      }
      for (const expectedProfile of [
        "https://github.com/Kentaro-Ono-jp",
        "https://www.linkedin.com/in/kentaro-ono/",
      ]) {
        if (!sameAs.includes(expectedProfile)) {
          errors.push(`${relativePath}: Person sameAsに${expectedProfile}がありません`);
        }
        if (!html.includes(`href="${expectedProfile}"`)) {
          errors.push(`${relativePath}: 画面上に${expectedProfile}へのリンクがありません`);
        }
      }
      for (const visibleName of ["小野賢太郎", "小野 賢太郎", "Kentaro Ono"]) {
        if (!html.includes(visibleName)) {
          errors.push(`${relativePath}: 画面上に${visibleName}がありません`);
        }
      }
    }

    const personIds = collectTypedNodes(schemas, "Person").map((person) => person["@id"]);
    if (personIds.some((id) => id !== "https://www.reactorfront.jp/#kentaro-ono")) {
      errors.push(`${relativePath}: 別のPerson @idが生成されています`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${jsonLdCount} JSON-LD blocks across ${htmlFiles.length} HTML files (${breadcrumbCount} BreadcrumbList items, ${articleCount} Article items).`);
}
