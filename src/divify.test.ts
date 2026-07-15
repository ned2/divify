// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { divify } from "./divify.js";
import type { ImageDataLike } from "./pixelate.js";

/** A 4x4 image: red top half, blue bottom half. */
function makeTestImage(): ImageDataLike {
  const data = new Uint8ClampedArray(4 * 4 * 4);
  for (let i = 0; i < data.length; i += 4) {
    const topHalf = i < data.length / 2;
    data[i] = topHalf ? 255 : 0;
    data[i + 2] = topHalf ? 0 : 255;
    data[i + 3] = 255;
  }
  return { width: 4, height: 4, data };
}

// divify accepts real ImageData; the structural type keeps tests canvas-free.
const testImage = () => makeTestImage() as ImageData;

beforeEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
});

describe("divify", () => {
  it("renders a grid container with one div per output pixel", async () => {
    const target = document.createElement("div");
    const { element } = await divify(target, testImage(), { pixelSize: 2 });

    expect(target.firstElementChild).toBe(element);
    expect(element.className).toBe("divify");
    expect(element.children).toHaveLength(4);
    expect(element.style.getPropertyValue("--divify-cols")).toBe("2");
    expect(element.style.getPropertyValue("--divify-pixel-size")).toBe("2px");

    const colors = [...element.children].map(
      (child) => (child as HTMLElement).style.backgroundColor,
    );
    expect(colors).toEqual([
      "rgb(255, 0, 0)",
      "rgb(255, 0, 0)",
      "rgb(0, 0, 255)",
      "rgb(0, 0, 255)",
    ]);
  });

  it("reports the source image's dimensions, before cropping", async () => {
    const target = document.createElement("div");
    const result = await divify(target, testImage(), { pixelSize: 3 });
    expect(result.sourceWidth).toBe(4);
    expect(result.sourceHeight).toBe(4);
  });

  it("replaces any existing content in the target", async () => {
    const target = document.createElement("div");
    target.innerHTML = "<p>old content</p>";
    await divify(target, testImage(), { pixelSize: 4 });
    expect(target.children).toHaveLength(1);
    expect(target.querySelector("p")).toBeNull();
  });

  it("injects the base stylesheet exactly once across calls", async () => {
    const target = document.createElement("div");
    await divify(target, testImage(), { pixelSize: 2 });
    await divify(target, testImage(), { pixelSize: 4 });
    expect(document.head.querySelectorAll("style[data-divify-base]")).toHaveLength(1);
  });

  it("sets the gap custom property when requested", async () => {
    const target = document.createElement("div");
    const { element } = await divify(target, testImage(), {
      pixelSize: 2,
      gap: "1px",
    });
    expect(element.style.getPropertyValue("--divify-gap")).toBe("1px");
  });

  it("scopes pixelStyles to this divified image only", async () => {
    const target = document.createElement("div");
    const first = await divify(target, testImage(), {
      pixelSize: 2,
      pixelStyles: { "border-radius": "5px" },
    });
    const id = first.element.dataset.divify;

    const sheets = document.head.querySelectorAll("style[data-divify-styles]");
    expect(sheets).toHaveLength(1);
    expect(sheets[0]!.textContent).toContain(`.divify[data-divify="${id}"] > div`);
    expect(sheets[0]!.textContent).toContain("border-radius: 5px;");
  });

  it("removes the old scoped sheet when a target is re-divified", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    await divify(target, testImage(), {
      pixelSize: 2,
      pixelStyles: { "border-radius": "5px" },
    });
    const second = await divify(target, testImage(), {
      pixelSize: 2,
      pixelStyles: { border: "1px solid black" },
    });

    const sheets = document.head.querySelectorAll("style[data-divify-styles]");
    expect(sheets).toHaveLength(1);
    expect(sheets[0]!.getAttribute("data-divify-styles")).toBe(
      second.element.dataset.divify,
    );
  });

  it("removes the old scoped sheet even when the new call has no pixelStyles", async () => {
    const target = document.createElement("div");
    await divify(target, testImage(), {
      pixelSize: 2,
      pixelStyles: { "border-radius": "5px" },
    });
    await divify(target, testImage(), { pixelSize: 2 });
    expect(document.head.querySelectorAll("style[data-divify-styles]")).toHaveLength(0);
  });

  it("leaves other targets' scoped sheets alone when re-divifying", async () => {
    const other = document.createElement("div");
    const kept = await divify(other, testImage(), {
      pixelSize: 2,
      pixelStyles: { "border-radius": "5px" },
    });

    const target = document.createElement("div");
    await divify(target, testImage(), {
      pixelSize: 2,
      pixelStyles: { border: "1px solid black" },
    });
    await divify(target, testImage(), { pixelSize: 2 });

    const sheets = document.head.querySelectorAll("style[data-divify-styles]");
    expect(sheets).toHaveLength(1);
    expect(sheets[0]!.getAttribute("data-divify-styles")).toBe(
      kept.element.dataset.divify,
    );
  });

  it("returns serializable HTML and CSS", async () => {
    const target = document.createElement("div");
    const result = await divify(target, testImage(), {
      pixelSize: 2,
      pixelStyles: { border: "1px solid black" },
    });

    expect(result.getHTML()).toContain('class="divify"');
    expect(result.getHTML()).toContain("background-color");
    expect(result.getCSS()).toContain("display: grid;");
    expect(result.getCSS()).toContain("border: 1px solid black;");
    // Host rules for <divified-image> are injected separately by the
    // element; serialized grids don't need them.
    expect(result.getCSS()).not.toContain("divified-image");
  });

  it("gives distinct ids to successive divified images", async () => {
    const a = await divify(document.createElement("div"), testImage(), {
      pixelSize: 2,
    });
    const b = await divify(document.createElement("div"), testImage(), {
      pixelSize: 2,
    });
    expect(a.element.dataset.divify).not.toBe(b.element.dataset.divify);
  });
});
