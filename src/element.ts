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
  static observedAttributes = ["src", "alt", "pixel-size", "gap", "letterbox"] as const;

  // ARIA goes through ElementInternals rather than host attributes so a
  // consumer's own role="..." / aria-label="..." on the element always wins
  // (host attributes take precedence over internals automatically). This
  // claims the element's one attachInternals() call — the platform hands it
  // out once per element, so subclasses must not call it themselves.
  #internals = this.attachInternals();
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
    this.#applyAlt();
    void this.#render();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    // Initial attributes are handled by connectedCallback.
    if (!this.isConnected || oldValue === newValue) return;
    if (name === "alt") {
      // A label change never changes any pixels — update the semantics
      // without re-rendering (or worse, re-fetching the source).
      this.#applyAlt();
      return;
    }
    void this.#render();
  }

  /**
   * Mirrors the <img> alt contract onto the host: alt text exposes an image
   * role with that accessible name, alt="" marks the element explicitly
   * decorative, and a missing alt leaves the semantics untouched.
   */
  #applyAlt(): void {
    const alt = this.getAttribute("alt");
    try {
      if (alt === null) {
        this.#internals.role = null;
        this.#internals.ariaLabel = null;
      } else if (alt === "") {
        this.#internals.role = "presentation";
        this.#internals.ariaLabel = null;
      } else {
        this.#internals.role = "img";
        this.#internals.ariaLabel = alt;
      }
    } catch {
      // Some DOM implementations (notably jsdom) expose attachInternals()
      // but not ARIA reflection on the result; render unlabeled rather than
      // breaking the element in consumers' test environments.
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
