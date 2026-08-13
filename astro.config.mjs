import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.reactorfront.jp",
  output: "static",
  trailingSlash: "always",
  compressHTML: true,
  build: {
    format: "directory",
  },
});
