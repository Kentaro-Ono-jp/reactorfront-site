export type JsonLd = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  href: string;
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

export const serializeJsonLd = (value: JsonLd): string =>
  JSON.stringify(value).replace(/</g, "\\u003c");
