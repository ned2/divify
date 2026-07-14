import { pixelate, toCSSColor } from "./pixelate.js";
import { type DivifySource, isImageDataLike, loadImageData } from "./sources.js";
import {
  addScopedPixelStyles,
  BASE_CSS,
  ensureBaseStyles,
  nextDivifyId,
} from "./styles.js";

export interface DivifyOptions {
  /**
   * Side length of each output pixel, in CSS px. Must be >= 1. If the image
   * dimensions are not multiples of pixelSize, the right and bottom edges
   * are cropped to the nearest multiple. A value of 1 is valid but produces
   * one div per source pixel — a wonderfully inefficient image format.
   * @default 10
   */
  pixelSize?: number;
  /** Space between pixels (any CSS gap value), e.g. "1px". */
  gap?: string;
  /**
   * CSS declarations applied to every pixel div, keyed by property name,
   * e.g. { "border-radius": "5px", "box-shadow": "3px 3px 3px" }.
   */
  pixelStyles?: Record<string, string>;
}

export interface DivifyResult {
  /** The generated grid container (already inserted into the target). */
  element: HTMLElement;
  /** Serialized markup of the divified image. */
  getHTML(): string;
  /** All CSS needed to render the divified image standalone. */
  getCSS(): string;
}

/**
 * Pixelates an image into a grid of divs and inserts it into `target`,
 * replacing any existing children.
 *
 * @param target The element to render the divified image into.
 * @param source An image URL, an <img> or <canvas> element, or an ImageData
 *   object (e.g. from a previous {@link loadImageData} call, for repeated
 *   pixelations without reloading the image).
 */
export async function divify(
  target: Element,
  source: DivifySource,
  options: DivifyOptions = {},
): Promise<DivifyResult> {
  const { gap, pixelStyles } = options;
  const pixelSize = Math.floor(options.pixelSize ?? 10);

  const imageData = isImageDataLike(source) ? source : await loadImageData(source);
  const grid = pixelate(imageData, pixelSize);

  const doc = target.ownerDocument;
  ensureBaseStyles(doc);

  const id = nextDivifyId();
  const container = doc.createElement("div");
  container.className = "divify";
  container.dataset.divify = id;
  container.style.setProperty("--divify-cols", String(grid.columns));
  container.style.setProperty("--divify-pixel-size", `${pixelSize}px`);
  if (gap !== undefined) {
    container.style.setProperty("--divify-gap", gap);
  }

  // Building one HTML string and parsing it in a single assignment is much
  // faster than inserting the pixel divs individually.
  container.innerHTML = grid.pixels
    .map((pixel) => `<div style="background-color:${toCSSColor(pixel)}"></div>`)
    .join("");

  const scopedCSS =
    pixelStyles && Object.keys(pixelStyles).length > 0
      ? addScopedPixelStyles(doc, id, pixelStyles)
      : "";

  target.replaceChildren(container);

  return {
    element: container,
    getHTML: () => container.outerHTML,
    getCSS: () => (scopedCSS ? `${BASE_CSS}\n\n${scopedCSS}` : BASE_CSS),
  };
}
