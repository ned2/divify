# divify — agent instructions

divify is a whimsical library that pixelates an image into a grid of divs
styled with nothing but CSS. It has no serious purpose and that's the point —
keep the playful tone in docs and demo copy, but hold the code itself to
normal production standards.

## Commands

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Vite dev server for the demo page (`demo/`)           |
| `npm run build`     | Library build → `dist/` (Vite lib mode + `tsc` types) |
| `npm test`          | Run the Vitest suite once                             |
| `npm run test:watch`| Vitest in watch mode                                  |
| `npm run typecheck` | `tsc --noEmit` over the whole project                 |

Always run `npm run typecheck && npm test` before considering a change done.

## Layout

- `src/pixelate.ts` — pure pixel-block averaging. **Must stay DOM-free** so it
  can be unit-tested in node; it operates on `ImageDataLike`, not `ImageData`.
- `src/sources.ts` — resolves URL / `<img>` / `<canvas>` sources to
  `ImageData` (the only canvas-touching module).
- `src/styles.ts` — injected stylesheets: one shared base sheet (CSS Grid
  layout driven by `--divify-*` custom properties) plus per-image scoped
  `pixelStyles` sheets keyed by a `data-divify` attribute.
- `src/divify.ts` — the public `divify()` orchestration.
- `src/element.ts` — the `<divified-image>` custom element. Registration is a
  module side effect; it is published as the `divify/element` subpath.
- `src/index.ts` — public exports. Anything not exported here (or from
  `element.ts`) is internal and free to change.
- `demo/` — the demo page, served by Vite; imports the library from `src/`
  via the `divify` alias in `vite.config.ts`. It doubles as the manual test
  page for canvas-dependent behavior that unit tests can't cover.
- `images/` — demo assets, served as Vite's publicDir. `george_small.jpg` is
  a downscaled copy of `george_original.jpg`; regenerate rather than divify
  the original (it's 4288px wide — that's a lot of divs).

## Conventions

- Strict TypeScript, ESM-only, **zero runtime dependencies**. Don't add any.
- Relative imports use explicit `.js` extensions (`./pixelate.js`).
- Tests live next to the code as `src/*.test.ts`. Default environment is
  node; DOM tests opt in with a `// @vitest-environment jsdom` pragma and
  must not require a real canvas (use `ImageDataLike`-shaped fixtures).
- Generated/authored CSS should be modern but Baseline-supported in current
  evergreen browsers (grid, `gap`, custom properties, `rgb(r g b / a)`,
  nesting, `light-dark()` are all fine). No vendor prefixes, no exotic
  at-risk features.
- Public API changes must be reflected in README.md and, if options change,
  in the `<divified-image>` observed attributes.
