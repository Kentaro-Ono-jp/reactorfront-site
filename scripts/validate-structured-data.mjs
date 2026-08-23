import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { indexableRoutes, SITE_URL } from "../src/site-metadata.ts";

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

const decodeHtml = (value = "") => value.replace(
  /&(amp|quot|#39|lt|gt);/g,
  (entity, name) => ({
    amp: "&",
    quot: '"',
    "#39": "'",
    lt: "<",
    gt: ">",
  })[name] ?? entity,
);

const parseTagAttributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([:@\w-]+)="([^"]*)"/g)].map((match) => [match[1], decodeHtml(match[2])]),
);

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

  const titleMatches = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  const title = decodeHtml(titleMatches[0]?.[1]?.trim());
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => parseTagAttributes(match[0]));
  const findMeta = (attribute, value) => metaTags.filter((meta) => meta[attribute] === value);
  const getMeta = (attribute, value) => findMeta(attribute, value)[0]?.content;
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => parseTagAttributes(match[0]));
  const canonicalLinks = linkTags.filter((link) => link.rel === "canonical");
  const description = getMeta("name", "description");
  const robots = getMeta("name", "robots") ?? "";
  const ogType = getMeta("property", "og:type");
  const ogTitle = getMeta("property", "og:title");
  const ogDescription = getMeta("property", "og:description");
  const ogUrl = getMeta("property", "og:url");
  const ogImage = getMeta("property", "og:image");
  const ogImageAlt = getMeta("property", "og:image:alt");
  const ogImageWidth = Number(getMeta("property", "og:image:width"));
  const ogImageHeight = Number(getMeta("property", "og:image:height"));
  const twitterTitle = getMeta("name", "twitter:title");
  const twitterDescription = getMeta("name", "twitter:description");
  const twitterImage = getMeta("name", "twitter:image");
  const twitterImageAlt = getMeta("name", "twitter:image:alt");

  if (titleMatches.length !== 1 || !title) {
    errors.push(`${relativePath}: titleが1件ではないか、空です`);
  }
  for (const [attribute, value] of [
    ["name", "description"],
    ["name", "robots"],
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:image"],
    ["property", "og:image:alt"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
    ["name", "twitter:image:alt"],
  ]) {
    if (findMeta(attribute, value).length !== 1) {
      errors.push(`${relativePath}: ${value} metaが1件ではありません`);
    }
  }
  if (canonicalLinks.length !== 1 || canonicalLinks[0]?.href !== canonicalMatch?.[1]) {
    errors.push(`${relativePath}: canonical linkが1件ではないか、解析結果と一致しません`);
  }
  if (!linkTags.some((link) => link.rel === "manifest" && link.href === "/site.webmanifest")) {
    errors.push(`${relativePath}: site.webmanifestへのlinkがありません`);
  }
  if (!description) {
    errors.push(`${relativePath}: meta descriptionがありません`);
  }
  if (ogTitle !== title || twitterTitle !== title) {
    errors.push(`${relativePath}: title、OGP title、X card titleが一致しません`);
  }
  if (ogDescription !== description || twitterDescription !== description) {
    errors.push(`${relativePath}: meta description、OGP description、X card descriptionが一致しません`);
  }
  if (ogUrl !== canonicalMatch?.[1]) {
    errors.push(`${relativePath}: OGP URLとcanonical URLが一致しません`);
  }
  if (getMeta("property", "og:site_name") !== "ReactorFront") {
    errors.push(`${relativePath}: og:site_nameがReactorFrontではありません`);
  }
  if (getMeta("property", "og:locale") !== "ja_JP") {
    errors.push(`${relativePath}: og:localeがja_JPではありません`);
  }
  if (getMeta("name", "twitter:card") !== "summary_large_image") {
    errors.push(`${relativePath}: X cardの形式がsummary_large_imageではありません`);
  }
  if (!getMeta("property", "og:image:type")?.startsWith("image/")) {
    errors.push(`${relativePath}: OGP画像のMIME typeがありません`);
  }
  if (ogImage !== twitterImage || ogImageAlt !== twitterImageAlt) {
    errors.push(`${relativePath}: OGPとX cardの画像またはaltが一致しません`);
  }
  try {
    const imageUrl = new URL(ogImage);
    if (imageUrl.protocol !== "https:" || imageUrl.origin !== new URL(SITE_URL).origin) {
      throw new Error("同じsiteのHTTPS URLではありません");
    }
  } catch {
    errors.push(`${relativePath}: OGP画像が有効な自siteのHTTPS URLではありません`);
  }
  if (!ogImageAlt || !Number.isInteger(ogImageWidth) || ogImageWidth <= 0 || !Number.isInteger(ogImageHeight) || ogImageHeight <= 0) {
    errors.push(`${relativePath}: OGP画像のaltまたは寸法が不正です`);
  }

  const webPages = schemas.filter((schema) => schema?.["@id"] === `${canonicalMatch?.[1]}#webpage`);
  if (webPages.length !== 1) {
    errors.push(`${relativePath}: canonicalに対応するWebPage系nodeが1件ではありません`);
  } else {
    const webPage = webPages[0];
    if (webPage.name !== title || webPage.description !== description || webPage.url !== canonicalMatch?.[1]) {
      errors.push(`${relativePath}: 画面metaとWebPage系nodeの主題が一致しません`);
    }
    if (webPage.inLanguage !== "ja-JP" || webPage.isPartOf?.["@id"] !== "https://www.reactorfront.jp/#website") {
      errors.push(`${relativePath}: WebPage系nodeの言語またはWebSite参照が不正です`);
    }
    if (webPage.publisher?.["@id"] !== "https://www.reactorfront.jp/#organization") {
      errors.push(`${relativePath}: WebPage系nodeのpublisherがReactorFrontではありません`);
    }
    const primaryImage = webPage.primaryImageOfPage;
    if (
      primaryImage?.url !== ogImage
      || primaryImage?.contentUrl !== ogImage
      || primaryImage?.caption !== ogImageAlt
      || primaryImage?.width !== ogImageWidth
      || primaryImage?.height !== ogImageHeight
    ) {
      errors.push(`${relativePath}: OGP画像とWebPage primaryImageOfPageが一致しません`);
    }
  }

  const articleForMetadata = schemas.find((schema) => hasType(schema, "Article"));
  if (ogType !== (articleForMetadata ? "article" : "website")) {
    errors.push(`${relativePath}: og:typeがページ種別と一致しません`);
  }
  const is404 = relativePath === "404.html";
  if (is404 && robots !== "noindex, nofollow") {
    errors.push(`${relativePath}: 404がnoindex, nofollowではありません`);
  }
  if (!is404 && robots.split(",").map((value) => value.trim()).includes("noindex")) {
    errors.push(`${relativePath}: 公開ページがnoindexです`);
  }
  if (!html.includes('aria-label="ReactorFront（リアクターフロント）ホーム"')) {
    errors.push(`${relativePath}: 共通headerのブランド日本語表記がありません`);
  }
  if (!html.includes("© 2026 ReactorFront（リアクターフロント） / 小野賢太郎")) {
    errors.push(`${relativePath}: 共通footerのブランド・代表者表記がありません`);
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
      if (person?.jobTitle !== "ソフトウェアエンジニア") {
        errors.push(`${relativePath}: Person jobTitleが画面の日本語表記と一致しません`);
      }
      if (person?.worksFor?.["@id"] !== "https://www.reactorfront.jp/#organization") {
        errors.push(`${relativePath}: Person worksForがReactorFrontの事業者nodeではありません`);
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
      for (const visibleProfileLabel of ["GitHubプロフィール", "LinkedInプロフィール"]) {
        if (!html.includes(visibleProfileLabel)) {
          errors.push(`${relativePath}: 画面上に${visibleProfileLabel}がありません`);
        }
      }
      if (!html.includes("ReactorFront（リアクターフロント）代表")) {
        errors.push(`${relativePath}: 画面上の所属にReactorFrontの日本語表記がありません`);
      }
      const organizationProfiles = Array.isArray(organizations[0]?.sameAs)
        ? organizations[0].sameAs
        : [organizations[0]?.sameAs];
      for (const personalProfile of [
        "https://github.com/Kentaro-Ono-jp",
        "https://www.linkedin.com/in/kentaro-ono/",
      ]) {
        if (organizationProfiles.includes(personalProfile)) {
          errors.push(`${relativePath}: 個人profileがProfessionalService sameAsへ混入しています`);
        }
      }
    }

    const personIds = collectTypedNodes(schemas, "Person").map((person) => person["@id"]);
    if (personIds.some((id) => id !== "https://www.reactorfront.jp/#kentaro-ono")) {
      errors.push(`${relativePath}: 別のPerson @idが生成されています`);
    }
  }

  if (relativePath === "portfolio/index.html") {
    if (articleSchemas.length !== 0) {
      errors.push(`${relativePath}: 概説ページをArticleとして出力しています`);
    }
    for (const expectedText of [
      "ReactorFront（リアクターフロント）が公開する実装例",
      "PDFを受け付ける",
      "AIで解析する",
      "人が確認する",
      "判断を記録する",
      "端から端まで通す実装単位（Vertical Slice）",
      "現時点の実証範囲と制約",
    ]) {
      if (!html.includes(expectedText)) {
        errors.push(`${relativePath}: 画面上に「${expectedText}」がありません`);
      }
    }
    if (!html.includes('href="https://github.com/Kentaro-Ono-jp/Portfolio"')) {
      errors.push(`${relativePath}: 公開Portfolio repositoryへのリンクがありません`);
    }
  }

  if (relativePath === "portfolio/ml/index.html") {
    const article = articleSchemas[0];
    if (article?.headline !== "MLモデルを同じ条件で評価し、採用理由を残し、問題時に戻す設計") {
      errors.push(`${relativePath}: Article headlineが画面の主題と一致しません`);
    }
    if (!article?.description?.includes("ReactorFront（リアクターフロント）")) {
      errors.push(`${relativePath}: Article descriptionに運営主体の日本語表記がありません`);
    }
    if (article?.isPartOf?.["@id"] !== "https://www.reactorfront.jp/#website") {
      errors.push(`${relativePath}: Article isPartOfが共通WebSiteではありません`);
    }
    for (const expectedText of [
      "現在採用中のモデル（Champion）と更新候補（Candidate）",
      "採用目録（promotion manifest）",
      "作成・評価の来歴（lineage）",
      "適合率（Precision）",
      "再現率（Recall）",
      "最終評価（holdout test）は公開用の合成文書4件",
      "実データに対する精度100%を意味しません",
      "対象commit",
      "708056f",
    ]) {
      if (!html.includes(expectedText)) {
        errors.push(`${relativePath}: 画面上に「${expectedText}」がありません`);
      }
    }
    if (!html.includes('href="https://github.com/Kentaro-Ono-jp/Portfolio/commit/708056f33d56f1affe2dbe8e1b58f4a722895b88"')) {
      errors.push(`${relativePath}: 確認したPortfolio commitへのリンクがありません`);
    }
  }

  if (relativePath === "portfolio/aws/index.html") {
    const article = articleSchemas[0];
    if (article?.headline !== "AWSで認証し、環境を構築・動作確認・撤収して、残存0件まで確かめる工程") {
      errors.push(`${relativePath}: Article headlineが画面の主題と一致しません`);
    }
    if (!article?.description?.includes("ReactorFront（リアクターフロント）")) {
      errors.push(`${relativePath}: Article descriptionに運営主体の日本語表記がありません`);
    }
    if (article?.isPartOf?.["@id"] !== "https://www.reactorfront.jp/#website") {
      errors.push(`${relativePath}: Article isPartOfが共通WebSiteではありません`);
    }
    for (const expectedText of [
      "用途別のIAM Roleへ一時的に切り替える",
      "認証から監査までの利用者操作を通す",
      "環境を撤収し、残り物がないか別経路で調べる",
      "許可できる権限の上限（Permissions Boundary）",
      "Fargateを選んだ理由",
      "5回のデプロイ試行後",
      "$2.43",
      "27カテゴリの残存0件確認",
      "自動destroyが7回失敗",
      "対象commit",
      "708056f",
    ]) {
      if (!html.includes(expectedText)) {
        errors.push(`${relativePath}: 画面上に「${expectedText}」がありません`);
      }
    }
    for (const expectedHref of [
      "https://github.com/Kentaro-Ono-jp/Portfolio/commit/708056f33d56f1affe2dbe8e1b58f4a722895b88",
      "https://github.com/Kentaro-Ono-jp/Portfolio/actions/runs/31489580926",
    ]) {
      if (!html.includes(`href="${expectedHref}"`)) {
        errors.push(`${relativePath}: 証拠link ${expectedHref} がありません`);
      }
    }
  }

  if (relativePath === "portfolio/aws/one-cent-ecr/index.html") {
    const article = articleSchemas[0];
    if (article?.headline !== "AWSの1セント増加からECRの残存9 imageを特定・削除した記録") {
      errors.push(`${relativePath}: Article headlineが画面の主題と一致しません`);
    }
    if (!article?.description?.includes("ReactorFront（リアクターフロント）")) {
      errors.push(`${relativePath}: Article descriptionに運営主体の日本語表記がありません`);
    }
    if (article?.isPartOf?.["@id"] !== "https://www.reactorfront.jp/#website") {
      errors.push(`${relativePath}: Article isPartOfが共通WebSiteではありません`);
    }
    for (const expectedText of [
      "請求の誤りではなく、残っていたECR imageの正しい保管料",
      "$2.42",
      "$2.43",
      "$0.003241094",
      "$0.034983709",
      "$0.038224803",
      "3 repository × 3世代",
      "削除してよい範囲",
      "存在を確認する範囲",
      "9個を明示削除し",
      "0 image",
    ]) {
      if (!html.includes(expectedText)) {
        errors.push(`${relativePath}: 画面上に「${expectedText}」がありません`);
      }
    }
    for (const repositoryName of ["reactorfront/web", "reactorfront/api", "reactorfront/ml"]) {
      if (!html.includes(repositoryName)) {
        errors.push(`${relativePath}: ECR repository識別子 ${repositoryName} がありません`);
      }
    }
    for (const imageTag of ["issue110-0580ae23", "sha-860c4c9ac91d", "sha-a1bad6a7af7d"]) {
      if (!html.includes(imageTag)) {
        errors.push(`${relativePath}: ECR image tag ${imageTag} がありません`);
      }
    }
    for (const expectedHref of [
      "https://github.com/Kentaro-Ono-jp/Portfolio/issues/133",
      "https://github.com/Kentaro-Ono-jp/Portfolio/pull/134",
      "https://github.com/Kentaro-Ono-jp/Portfolio/commit/eac250a38e3e",
    ]) {
      if (!html.includes(`href="${expectedHref}"`)) {
        errors.push(`${relativePath}: 証拠link ${expectedHref} がありません`);
      }
    }
  }

  if (relativePath === "infrastructure/index.html") {
    const article = articleSchemas[0];
    if (article?.headline !== "独自ドメイン・Web・仕事用メールを構築し、外部から確認して維持する手順") {
      errors.push(`${relativePath}: Article headlineが画面の主題と一致しません`);
    }
    if (!article?.description?.includes("ReactorFront（リアクターフロント）")) {
      errors.push(`${relativePath}: Article descriptionに運営主体の日本語表記がありません`);
    }
    if (article?.isPartOf?.["@id"] !== "https://www.reactorfront.jp/#website") {
      errors.push(`${relativePath}: Article isPartOfが共通WebSiteではありません`);
    }
    for (const expectedText of [
      "ReactorFront（リアクターフロント）の実構成",
      "検索時に使われる小文字表記 <strong>reactorfront</strong>",
      "すべて小野賢太郎が運営する同じ事業を指します",
      "reactorfront.jp",
      "www.reactorfront.jp",
      "kentaro.ono@reactorfront.jp",
      "XServerドメイン",
      "GitHub Pages",
      "GitHub Actions",
      "Google Workspace",
      "本文では実ドメインを <code>example.com</code> に置き換え",
      "ドメインを契約・更新する事業者（レジストラ）",
      "正式なDNS情報を返す場所（権威DNS）",
      "Webサイトの公開先（Webホスティング）",
      "仕事用メールの送受信先（メールサービス）",
      "公開repository",
      "Source: GitHub Actions",
      "Custom domain:",
      "Enforce HTTPS",
      "送信元の許可リスト",
      "メールへの電子署名",
      "失敗時の方針と報告",
      "毎月",
      "main反映後",
      "DNS変更後",
      "導入直後は毎週",
      "3か月ごと",
      "2026-08-23時点の実測",
      "200 OK",
      "X-Cache: HIT",
    ]) {
      if (!html.includes(expectedText)) {
        errors.push(`${relativePath}: 画面上に「${expectedText}」がありません`);
      }
    }
    for (const preservedCommand of [
      "Resolve-DnsName example.com -Type NS",
      "Resolve-DnsName example.com -Type A",
      "Resolve-DnsName example.com -Type AAAA",
      "Resolve-DnsName www.example.com -Type CNAME",
      "Resolve-DnsName example.com -Type MX",
      "Resolve-DnsName example.com -Type TXT",
      "Resolve-DnsName _dmarc.example.com -Type TXT",
    ]) {
      if (!html.includes(preservedCommand)) {
        errors.push(`${relativePath}: 確認command「${preservedCommand}」がありません`);
      }
    }
    for (const expectedHref of [
      "https://www.xdomain.ne.jp/manual/man_domain_dns_setting.php",
      "https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages",
      "https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site",
      "https://support.google.com/a/answer/6156494",
      "https://support.google.com/a/answer/33786",
      "https://support.google.com/a/answer/174124",
      "https://support.google.com/a/answer/10032473",
    ]) {
      if (!html.includes(`href="${expectedHref}"`)) {
        errors.push(`${relativePath}: 公式資料link ${expectedHref} がありません`);
      }
    }
    for (const removedEnglishLabel of [
      "Freelance infrastructure guide",
      "Prologue / Why I built it",
      "The actual stack",
      "First principle",
      "Why GitHub Pages",
      "Delivery architecture",
      "Build order",
      "Small, understandable, yours",
    ]) {
      if (html.includes(removedEnglishLabel)) {
        errors.push(`${relativePath}: 英語だけの旧label「${removedEnglishLabel}」が残っています`);
      }
    }
  }

  if (relativePath === "infrastructure/google-search/index.html") {
    const article = articleSchemas[0];
    if (article?.headline !== "Google検索がページを取得・索引・表示する流れと、サイト運営者ができること") {
      errors.push(`${relativePath}: Article headlineが画面の主題と一致しません`);
    }
    if (!article?.description?.includes("ReactorFront（リアクターフロント）")) {
      errors.push(`${relativePath}: Article descriptionに運営主体の日本語表記がありません`);
    }
    if (article?.isPartOf?.["@id"] !== "https://www.reactorfront.jp/#website") {
      errors.push(`${relativePath}: Article isPartOfが共通WebSiteではありません`);
    }
    for (const expectedText of [
      "取得（Crawl）",
      "索引へ保存（Index）",
      "検索結果へ表示（Serve）",
      "取得の許可（robots.txt）",
      "公開URL一覧（sitemap.xml）",
      "代表URL（canonical）",
      "301転送",
      "ドメイン全体を登録",
      "DNSで所有者だと確認",
      "公開URL一覧を送信",
      "登録状態と現在の公開状態を確認",
      "再取得を依頼して待つ",
      "ReactorFront</strong>、<strong>リアクターフロント</strong>、小文字の <strong>reactorfront</strong>",
      "同じ事業者・サイトの表記として同じnodeへ置き",
      "事業者（ProfessionalService）",
      "代表者（Person）",
      "サイト（WebSite）",
      "各ページ（WebPage）",
      "&quot;alternateName&quot;: [",
      "これは候補と関係を伝える実装であり、Googleが検索結果のサイト名へ採用する保証ではありません",
      "共有時の画像情報（OGP）",
      "小さなsite icon（favicon）",
      "以下は2026-08-18に",
      "ある観測時点の検索結果件数が12件",
      "ログイン中 / プライベート",
      "個別施策だけの効果とは断定しません",
      "リッチリザルトの表示資格は整えられますが、実際の表示は保証できません",
      "リッチリザルトを実際に表示するか",
      "AI概要が生成されるか、その内容",
      "重要な内容更新の後に行うこと",
    ]) {
      if (!html.includes(expectedText)) {
        errors.push(`${relativePath}: 画面上に「${expectedText}」がありません`);
      }
    }
    for (const expectedHref of [
      "https://github.com/Kentaro-Ono-jp",
      "https://www.linkedin.com/in/kentaro-ono/",
      "https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/20",
      "https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/21",
      "https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/22",
      "https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/23",
      "https://github.com/Kentaro-Ono-jp/reactorfront-site/pull/24",
      "https://developers.google.com/search/docs/fundamentals/how-search-works?hl=ja",
      "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=ja",
      "https://developers.google.com/search/docs/appearance/site-names?hl=ja",
      "https://developers.google.com/search/docs/appearance/structured-data/organization?hl=ja",
      "https://developers.google.com/search/docs/appearance/google-images?hl=ja",
      "https://developers.google.com/search/docs/appearance/favicon-in-search?hl=ja",
    ]) {
      if (!html.includes(`href="${expectedHref}"`)) {
        errors.push(`${relativePath}: 証拠または公式資料link ${expectedHref} がありません`);
      }
    }
    for (const removedEnglishLabel of [
      "Google Search / Field notes",
      "Prologue / After publishing",
      "Three different stages",
      "Before Search Console",
      "Meaning, not keywords",
      "Sanitized example",
      "Images &amp; identity",
      "One mark across the site",
      "What we actually saw",
      "AI-generated overview",
      "Change log / Public evidence",
      "We can control",
      "Google decides",
      "After each meaningful release",
      "Primary sources",
      "From infrastructure to discovery",
    ]) {
      if (html.includes(removedEnglishLabel)) {
        errors.push(`${relativePath}: 英語だけの旧label「${removedEnglishLabel}」が残っています`);
      }
    }
  }
}

try {
  const manifest = JSON.parse(await readFile(path.join(distDirectory, "site.webmanifest"), "utf8"));
  if (manifest.name !== "ReactorFront" || manifest.short_name !== "ReactorFront") {
    errors.push("site.webmanifest: nameまたはshort_nameがReactorFrontではありません");
  }
  if (manifest.lang !== "ja" || manifest.start_url !== "/") {
    errors.push("site.webmanifest: langまたはstart_urlが不正です");
  }
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  for (const expectedIcon of [
    { src: "/brand/reactorfront-mark-192.png", sizes: "192x192", type: "image/png" },
    { src: "/brand/reactorfront-mark-512.png", sizes: "512x512", type: "image/png" },
  ]) {
    if (!icons.some((icon) => icon.src === expectedIcon.src && icon.sizes === expectedIcon.sizes && icon.type === expectedIcon.type)) {
      errors.push(`site.webmanifest: icon ${expectedIcon.src} のURL、寸法、形式が一致しません`);
    }
  }
} catch (error) {
  errors.push(`site.webmanifestを検査できません: ${error.message}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${jsonLdCount} JSON-LD blocks across ${htmlFiles.length} HTML files (${breadcrumbCount} BreadcrumbList items, ${articleCount} Article items), plus synchronized metadata, social images, shared branding, 404 robots and web manifest.`);
}
