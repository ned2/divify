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
 * The <divified-image> rules live here rather than as inline styles on the
 * host so any consumer stylesheet can override them (plain tag/attribute
 * selectors lose to author CSS; inline styles don't). The [letterbox] box is
 * sized by --divified-source-* custom properties set by the element.
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
}

divified-image {
  display: inline-block;
}

divified-image[letterbox] {
  display: inline-grid;
  place-content: center;
  inline-size: var(--divified-source-width);
  aspect-ratio: var(--divified-source-ratio);
}`;

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
