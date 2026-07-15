// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageDataLike } from "./pixelate.js";

// The element resolves its src through loadImageData, which needs a real
// canvas; stub it with an ImageDataLike fixture so jsdom can run the rest.
const loadImageData = vi.hoisted(() => vi.fn());
vi.mock("./sources.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./sources.js")>()),
  loadImageData,
}));

import { defineDivifiedImage } from "./element.js";

/** A width x height image of solid red pixels. */
function makeTestImage(width: number, height: number): ImageDataLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 3] = 255;
  }
  return { width, height, data };
}

/** Waits for in-flight #render() calls (they only await resolved promises). */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

// jsdom's ElementInternals throws on any ARIA property access, so substitute
// a plain recording object per host. Real ARIA reflection (and the fact that
// host attributes beat internals) is platform behavior, verified manually in
// a browser via the demo page.
interface FakeInternals {
  role: string | null;
  ariaLabel: string | null;
}
const internalsByHost = new Map<HTMLElement, FakeInternals>();
const internalsOf = (element: HTMLElement) => internalsByHost.get(element)!;

function createElement(attributes: Record<string, string>): HTMLElement {
  const element = document.createElement("divified-image");
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  return element;
}

beforeEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
  loadImageData.mockReset();
  loadImageData.mockResolvedValue(makeTestImage(6, 4) as ImageData);
  internalsByHost.clear();
  vi.spyOn(HTMLElement.prototype, "attachInternals").mockImplementation(function (
    this: HTMLElement,
  ) {
    const internals: FakeInternals = { role: null, ariaLabel: null };
    internalsByHost.set(this, internals);
    return internals as unknown as ElementInternals;
  });
});

describe("<divified-image>", () => {
  it("renders a divify grid from its src attribute", async () => {
    const element = createElement({ src: "photo.jpg", "pixel-size": "2" });
    await settled();

    expect(loadImageData).toHaveBeenCalledWith("photo.jpg");
    const grid = element.firstElementChild as HTMLElement;
    expect(grid.className).toBe("divify");
    expect(grid.children).toHaveLength(6);
  });

  it("injects the base and host stylesheets on connect, before the source loads", () => {
    createElement({ src: "photo.jpg" });
    const base = document.head.querySelector("style[data-divify-base]");
    expect(base).not.toBeNull();
    expect(base!.textContent).not.toContain("divified-image");

    const host = document.head.querySelector(
      'style[data-divify-element="divified-image"]',
    );
    expect(host).not.toBeNull();
    expect(host!.textContent).toContain("divified-image[letterbox]");
    expect(host!.textContent).toContain("max-inline-size: 100%");
    expect(host!.textContent).toContain("overflow: auto");
  });

  it("injects the host stylesheet once per tag name", () => {
    createElement({ src: "photo.jpg" });
    createElement({ src: "other.jpg" });
    expect(document.head.querySelectorAll("style[data-divify-element]")).toHaveLength(1);
  });

  it("styles elements registered under a custom tag name", async () => {
    defineDivifiedImage("pixel-pic");
    const element = document.createElement("pixel-pic");
    element.setAttribute("src", "photo.jpg");
    element.setAttribute("pixel-size", "2");
    document.body.append(element);
    await settled();

    const host = document.head.querySelector('style[data-divify-element="pixel-pic"]');
    expect(host).not.toBeNull();
    expect(host!.textContent).toContain("pixel-pic[letterbox]");
    expect(element.firstElementChild!.className).toBe("divify");
  });

  it("styles the host via the stylesheet, not inline styles", async () => {
    const element = createElement({ src: "photo.jpg", letterbox: "" });
    await settled();
    expect(element.style.display).toBe("");
  });

  it("exposes the source dimensions as custom properties", async () => {
    const element = createElement({ src: "photo.jpg", "pixel-size": "2" });
    await settled();

    expect(element.style.getPropertyValue("--divified-source-width")).toBe("6px");
    expect(element.style.getPropertyValue("--divified-source-ratio")).toBe("6 / 4");
  });

  it("re-renders when the letterbox attribute is toggled", async () => {
    const element = createElement({ src: "photo.jpg", "pixel-size": "2" });
    await settled();
    const before = element.firstElementChild;

    element.setAttribute("letterbox", "");
    await settled();
    expect(element.firstElementChild).not.toBe(before);
    expect(element.firstElementChild!.className).toBe("divify");
  });

  it("reuses the decoded image across non-src attribute changes", async () => {
    const element = createElement({ src: "photo.jpg", "pixel-size": "2" });
    await settled();
    expect(loadImageData).toHaveBeenCalledTimes(1);

    element.setAttribute("pixel-size", "1");
    await settled();
    expect(loadImageData).toHaveBeenCalledTimes(1);
    expect(element.firstElementChild!.children).toHaveLength(24);
  });

  it("invalidates the image cache when src changes", async () => {
    const element = createElement({ src: "photo.jpg", "pixel-size": "2" });
    await settled();

    loadImageData.mockResolvedValue(makeTestImage(2, 2) as ImageData);
    element.setAttribute("src", "other.jpg");
    await settled();

    expect(loadImageData).toHaveBeenCalledTimes(2);
    expect(loadImageData).toHaveBeenLastCalledWith("other.jpg");
    expect(element.style.getPropertyValue("--divified-source-width")).toBe("2px");
  });

  it("clears the grid and custom properties when src is removed", async () => {
    const element = createElement({ src: "photo.jpg", "pixel-size": "2" });
    await settled();

    element.removeAttribute("src");
    await settled();

    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("--divified-source-width")).toBe("");
    expect(element.style.getPropertyValue("--divified-source-ratio")).toBe("");
  });

  it("exposes an image role and accessible name via ElementInternals from alt", async () => {
    const element = createElement({ src: "photo.jpg", alt: "George the cat" });
    await settled();

    const internals = internalsOf(element);
    expect(internals.role).toBe("img");
    expect(internals.ariaLabel).toBe("George the cat");
    // Internals only — the host attributes stay the consumer's to set, and
    // theirs must win.
    expect(element.hasAttribute("role")).toBe(false);
    expect(element.hasAttribute("aria-label")).toBe(false);
  });

  it('treats alt="" as explicitly decorative', async () => {
    const element = createElement({ src: "photo.jpg", alt: "" });
    await settled();

    expect(internalsOf(element).role).toBe("presentation");
    expect(internalsOf(element).ariaLabel).toBeNull();
  });

  it("leaves the semantics untouched when alt is missing", async () => {
    const element = createElement({ src: "photo.jpg" });
    await settled();

    expect(internalsOf(element).role).toBeNull();
    expect(internalsOf(element).ariaLabel).toBeNull();
  });

  it("updates the label on alt change without re-fetching or re-rendering", async () => {
    const element = createElement({
      src: "photo.jpg",
      "pixel-size": "2",
      alt: "a cat",
    });
    await settled();
    const grid = element.firstElementChild;
    expect(loadImageData).toHaveBeenCalledTimes(1);

    element.setAttribute("alt", "a very pixelated cat");
    await settled();

    expect(internalsOf(element).ariaLabel).toBe("a very pixelated cat");
    expect(loadImageData).toHaveBeenCalledTimes(1);
    expect(element.firstElementChild).toBe(grid);
  });

  it("clears the semantics when alt is removed", async () => {
    const element = createElement({ src: "photo.jpg", alt: "a cat" });
    await settled();

    element.removeAttribute("alt");
    await settled();

    expect(internalsOf(element).role).toBeNull();
    expect(internalsOf(element).ariaLabel).toBeNull();
  });

  it("hides the rendered grid from assistive technology", async () => {
    const element = createElement({ src: "photo.jpg", "pixel-size": "2" });
    await settled();

    expect(element.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  });

  it("dispatches an error event when the source fails to load", async () => {
    loadImageData.mockRejectedValue(new Error("no such image"));
    const element = createElement({});
    const errors: ErrorEvent[] = [];
    element.addEventListener("error", (event) => {
      errors.push(event as ErrorEvent);
    });

    element.setAttribute("src", "missing.jpg");
    await settled();

    expect(errors).toHaveLength(1);
    expect((errors[0]!.error as Error).message).toBe("no such image");
  });
});
