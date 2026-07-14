/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  // The dev server serves the demo; `vite build` builds the library.
  root: "demo",
  publicDir: path("images"),
  resolve: {
    alias: {
      "divify/element": path("src/element.ts"),
      divify: path("src/index.ts"),
    },
  },
  cacheDir: path("node_modules/.vite"),
  build: {
    outDir: path("dist"),
    emptyOutDir: true,
    copyPublicDir: false,
    // Publish readable code; consumers' bundlers do the minifying.
    minify: false,
    lib: {
      entry: {
        index: path("src/index.ts"),
        element: path("src/element.ts"),
      },
      formats: ["es"],
    },
  },
  test: {
    dir: path("src"),
    environment: "node",
  },
});
