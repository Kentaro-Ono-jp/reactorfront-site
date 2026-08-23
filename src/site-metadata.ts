export const SITE_URL = "https://www.reactorfront.jp/";

export interface IndexableRouteMetadata {
  readonly path: `/${string}`;
  readonly lastModified: string;
  readonly datePublished?: string;
}

/**
 * Search-indexable routes and their real content timestamps.
 *
 * These values are intentionally static. Do not replace them with a build or
 * deploy timestamp: an unchanged page must keep the same sitemap lastmod.
 */
export const indexableRoutes = [
  { path: "/", lastModified: "2026-08-23T14:06:52+09:00" },
  { path: "/profile/", lastModified: "2026-08-23T14:16:45+09:00" },
  { path: "/portfolio/", lastModified: "2026-08-23T14:22:52+09:00" },
  {
    path: "/portfolio/aws/",
    datePublished: "2026-08-14T08:45:00+09:00",
    lastModified: "2026-08-23T14:48:28+09:00",
  },
  {
    path: "/portfolio/aws/one-cent-ecr/",
    datePublished: "2026-08-23T03:58:20+09:00",
    lastModified: "2026-08-23T11:11:31+09:00",
  },
  {
    path: "/portfolio/ml/",
    datePublished: "2026-08-14T11:22:21+09:00",
    lastModified: "2026-08-23T14:32:25+09:00",
  },
  {
    path: "/infrastructure/",
    datePublished: "2026-08-14T06:13:26+09:00",
    lastModified: "2026-08-23T11:21:05+09:00",
  },
  {
    path: "/infrastructure/google-search/",
    datePublished: "2026-08-16T07:48:04+09:00",
    lastModified: "2026-08-23T11:21:05+09:00",
  },
] as const satisfies readonly IndexableRouteMetadata[];

export type IndexableRoutePath = (typeof indexableRoutes)[number]["path"];
export type ArticleRouteMetadata = IndexableRouteMetadata & {
  readonly datePublished: string;
};

export const getArticleRouteMetadata = (path: IndexableRoutePath): ArticleRouteMetadata => {
  const route = indexableRoutes.find((candidate) => candidate.path === path);
  if (!route || !("datePublished" in route)) {
    throw new Error(`${path} is not configured as an Article route.`);
  }
  return route;
};

const seenPaths = new Set<string>();
for (const route of indexableRoutes) {
  if (seenPaths.has(route.path)) {
    throw new Error(`Duplicate indexable route: ${route.path}`);
  }
  seenPaths.add(route.path);

  if (route.path !== "/" && !route.path.endsWith("/")) {
    throw new Error(`Indexable route must use a trailing slash: ${route.path}`);
  }
  if (Number.isNaN(Date.parse(route.lastModified))) {
    throw new Error(`Invalid lastModified for ${route.path}: ${route.lastModified}`);
  }
  if ("datePublished" in route) {
    if (Number.isNaN(Date.parse(route.datePublished))) {
      throw new Error(`Invalid datePublished for ${route.path}: ${route.datePublished}`);
    }
    if (Date.parse(route.datePublished) > Date.parse(route.lastModified)) {
      throw new Error(`datePublished is after lastModified for ${route.path}`);
    }
  }
}
