/**
 * Stylesheet management. divify styles pixels via CSS rules rather than
 * inline styles (except each pixel's background color) so that generated
 * images stay easy to restyle after the fact.
 */

/**
 * The layout rules shared by every divified image. Injected into the
 * document once; per-image values (column count, pixel size, gap) are
 * supplied as custom properties inline on each container.
 *
 * forced-color-adjust: the pixels are image content painted entirely with
 * background-color — the first thing forced-colors modes (Windows High
 * Contrast) strip. Exempt them the way real <img> content is exempt, or the
 * whole image renders as a blank rectangle for exactly the users the mode
 * serves. A no-op in browsers without forced-colors modes.
 */
export const BASE_CSS = `.divify {
  display: grid;
  grid-template-columns: repeat(var(--divify-cols), var(--divify-pixel-size));
  grid-auto-rows: var(--divify-pixel-size);
  gap: var(--divify-gap, 0);
  width: fit-content;
}

.divify > div {
  box-sizing: border-box;
  forced-color-adjust: none;
}`;

/**
 * The host rules for the <divified-image> element, parameterized by tag name
 * so registrations under a custom name get them too. Kept out of BASE_CSS so
 * getCSS() serializations carry only grid rules.
 *
 * These are stylesheet rules rather than inline styles on the host so any
 * consumer CSS can override them — never widening the page is the safe
 * default, but e.g. deliberate bleed (overflow: visible) and unclipped pixel
 * shadows are two documented lines away. The [letterbox] box is sized by
 * --divified-source-* custom properties set by the element; max-inline-size
 * shrinks that box like an <img> on narrow viewports (the grid inside
 * scrolls). place-content is declared twice: browsers without overflow
 * alignment keep plain centering, the rest get `safe` so a grid overflowing
 * the letterbox stays scrollable-to instead of clipped at the start edge.
 */
export function elementCSS(tagName: string): string {
  return `${tagName} {
  display: inline-block;
  max-inline-size: 100%;
  overflow: auto;
}

${tagName}[letterbox] {
  display: inline-grid;
  place-content: center;
  place-content: safe center;
  inline-size: var(--divified-source-width);
  aspect-ratio: var(--divified-source-ratio);
}`;
}

let counter = 0;

/** Returns a document-wide unique id for scoping one divified image's styles. */
export function nextDivifyId(): string {
  return String(counter++);
}

/** Injects the shared base stylesheet into the document, once. */
export function ensureBaseStyles(doc: Document): void {
  if (doc.head.querySelector("style[data-divify-base]")) return;
  const sheet = doc.createElement("style");
  sheet.setAttribute("data-divify-base", "");
  sheet.textContent = BASE_CSS;
  doc.head.append(sheet);
}

/** Injects the element's host stylesheet, once per (document, tag name). */
export function ensureElementStyles(doc: Document, tagName: string): void {
  if (doc.head.querySelector(`style[data-divify-element="${tagName}"]`)) return;
  const sheet = doc.createElement("style");
  sheet.setAttribute("data-divify-element", tagName);
  sheet.textContent = elementCSS(tagName);
  doc.head.append(sheet);
}

/**
 * Injects a stylesheet applying `styles` to every pixel of the divified
 * image identified by `id`, and returns the CSS text.
 */
export function addScopedPixelStyles(
  doc: Document,
  id: string,
  styles: Record<string, string>,
): string {
  const declarations = Object.entries(styles)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  const css = `.divify[data-divify="${id}"] > div {\n${declarations}\n}`;
  const sheet = doc.createElement("style");
  sheet.setAttribute("data-divify-styles", id);
  sheet.textContent = css;
  doc.head.append(sheet);
  return css;
}

/** Removes the scoped stylesheet of the divified image identified by `id`. */
export function removeScopedPixelStyles(doc: Document, id: string): void {
  doc.head.querySelector(`style[data-divify-styles="${id}"]`)?.remove();
}
