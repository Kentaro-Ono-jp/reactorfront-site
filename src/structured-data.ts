export type JsonLd = Record<string, unknown>;

export const ORGANIZATION_ID = "https://www.reactorfront.jp/#organization";
export const PERSON_ID = "https://www.reactorfront.jp/#kentaro-ono";
export const WEBSITE_ID = "https://www.reactorfront.jp/#website";

export const kentaroOno: JsonLd = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "小野賢太郎",
  alternateName: ["小野 賢太郎", "Kentaro Ono"],
  jobTitle: "Software Engineer",
  url: "https://www.reactorfront.jp/profile/",
  worksFor: {
    "@id": ORGANIZATION_ID,
  },
  sameAs: [
    "https://github.com/Kentaro-Ono-jp",
    "https://www.linkedin.com/in/kentaro-ono/",
  ],
};

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export interface ArticleSchemaInput {
  canonical: string;
  headline: string;
  description: string;
  images: readonly string[];
  datePublished: string;
  dateModified: string;
}

export const createBreadcrumbList = (
  items: readonly BreadcrumbItem[],
  site: URL,
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${new URL(items.at(-1)?.href ?? "/", site).href}#breadcrumb`,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: new URL(item.href, site).href,
  })),
});

export const createArticle = ({
  canonical,
  headline,
  description,
  images,
  datePublished,
  dateModified,
}: ArticleSchemaInput): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${canonical}#article`,
  url: canonical,
  headline,
  description,
  image: images,
  datePublished,
  dateModified,
  inLanguage: "ja-JP",
  mainEntityOfPage: {
    "@id": `${canonical}#webpage`,
  },
  author: kentaroOno,
  publisher: {
    "@id": ORGANIZATION_ID,
  },
  isPartOf: {
    "@id": WEBSITE_ID,
  },
});

export const serializeJsonLd = (value: JsonLd): string =>
  JSON.stringify(value).replace(/</g, "\\u003c");
