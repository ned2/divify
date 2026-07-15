/**
 * `<divified-image>` — a custom element wrapper around divify() for
 * zero-JavaScript usage:
 *
 *     <script type="module" src="divify/element"></script>
 *     <divified-image src="photo.jpg" pixel-size="8" gap="1px"></divified-image>
 *
 * Importing this module registers the element as a side effect; use
 * defineDivifiedImage() to register it under a different tag name.
 */
import { divify } from "./divify.js";
import { loadImageData } from "./sources.js";
import { ensureBaseStyles, ensureElementStyles } from "./styles.js";

declare global {
  interface HTMLElementTagNameMap {
    "divified-image": DivifiedImage;
  }
}

export class DivifiedImage extends HTMLElement {
  static observedAttributes = ["src", "pixel-size", "gap", "letterbox"] as const;

  #renderToken = 0;
  // Decoded pixels of the current src, reused across attribute-driven
  // re-renders so a pixel-size slider doesn't re-fetch the image per step.
  #imageData: ImageData | null = null;
  #imageDataSrc: string | null = null;

  connectedCallback(): void {
    // The injected sheets supply the grid layout and this element's host
    // styling (default display, overflow containment, [letterbox]); divify()
    // would inject the base sheet too, but only after the source loads. The
    // host sheet is keyed by localName so elements registered under a custom
    // tag name via defineDivifiedImage() get it as well.
    ensureBaseStyles(this.ownerDocument);
    ensureElementStyles(this.ownerDocument, this.localName);
    void this.#render();
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    // Initial attributes are handled by connectedCallback.
    if (this.isConnected && oldValue !== newValue) {
      void this.#render();
    }
  }

  async #render(): Promise<void> {
    const src = this.getAttribute("src");
    if (!src) {
      this.#imageData = null;
      this.#imageDataSrc = null;
      this.style.removeProperty("--divified-source-width");
      this.style.removeProperty("--divified-source-ratio");
      this.replaceChildren();
      return;
    }

    const pixelSize = Number(this.getAttribute("pixel-size"));
    const gap = this.getAttribute("gap") ?? undefined;
    const token = ++this.#renderToken;

    try {
      let imageData = this.#imageDataSrc === src ? this.#imageData : null;
      if (!imageData) {
        imageData = await loadImageData(src);
        // A newer render superseded this one while the source loaded.
        if (token !== this.#renderToken) return;
        this.#imageData = imageData;
        this.#imageDataSrc = src;
      }

      // Render off-DOM first so a slow source doesn't blank the element, and
      // stale renders (the token check) never clobber newer ones.
      const staging = this.ownerDocument.createElement("div");
      await divify(staging, imageData, {
        pixelSize: pixelSize >= 1 ? pixelSize : undefined,
        gap,
        pixelStyles: undefined,
      });
      if (token === this.#renderToken) {
        // Source dimensions consumed by the base sheet's [letterbox] rule.
        // Custom properties only — a direct style.display etc. would defeat
        // consumer CSS overrides.
        this.style.setProperty("--divified-source-width", `${imageData.width}px`);
        this.style.setProperty(
          "--divified-source-ratio",
          `${imageData.width} / ${imageData.height}`,
        );
        this.replaceChildren(...staging.children);
      }
    } catch (error) {
      if (token === this.#renderToken) {
        this.dispatchEvent(new ErrorEvent("error", { error }));
      }
    }
  }
}

/** Registers the element (default tag name: "divified-image"). Idempotent. */
export function defineDivifiedImage(tagName = "divified-image"): void {
  if (customElements.get(tagName)) return;
  // A constructor can only be registered once, and importing this module
  // already claims DivifiedImage for "divified-image" — every other tag name
  // needs its own subclass or define() throws NotSupportedError.
  customElements.define(
    tagName,
    tagName === "divified-image" ? DivifiedImage : class extends DivifiedImage {},
  );
}

defineDivifiedImage();
