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

export class DivifiedImage extends HTMLElement {
  static observedAttributes = ["src", "pixel-size", "gap"];

  #renderToken = 0;

  connectedCallback(): void {
    if (!this.style.display) {
      this.style.display = "inline-block";
    }
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
      this.replaceChildren();
      return;
    }

    const pixelSize = Number(this.getAttribute("pixel-size"));
    const gap = this.getAttribute("gap") ?? undefined;
    const token = ++this.#renderToken;

    try {
      // Load off-DOM first so a slow source doesn't blank the element, and
      // stale renders (the token check) never clobber newer ones.
      const staging = this.ownerDocument.createElement("div");
      await divify(staging, src, {
        pixelSize: pixelSize >= 1 ? pixelSize : undefined,
        gap,
        pixelStyles: undefined,
      });
      if (token === this.#renderToken) {
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
  if (!customElements.get(tagName)) {
    customElements.define(tagName, DivifiedImage);
  }
}

defineDivifiedImage();
