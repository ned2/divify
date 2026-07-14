import { describe, expect, it } from "vitest";
import { type ImageDataLike, pixelate, toCSSColor } from "./pixelate.js";

/** Builds an ImageDataLike from rows of [r, g, b, a] tuples. */
function makeImage(rows: number[][][]): ImageDataLike {
  const height = rows.length;
  const width = rows[0]!.length;
  const data = new Uint8ClampedArray(width * height * 4);
  rows.flat(2).forEach((byte, i) => {
    data[i] = byte;
  });
  return { width, height, data };
}

const RED = [255, 0, 0, 255];
const BLUE = [0, 0, 255, 255];
const CLEAR = [0, 0, 0, 0];

describe("pixelate", () => {
  it("averages the full block, not just a row/column sample", () => {
    const image = makeImage([
      [RED, RED],
      [BLUE, BLUE],
    ]);
    const { columns, rows, pixels } = pixelate(image, 2);
    expect(columns).toBe(1);
    expect(rows).toBe(1);
    expect(pixels).toEqual([{ r: 128, g: 0, b: 128, a: 255 }]);
  });

  it("returns one pixel per source pixel when pixelSize is 1", () => {
    const image = makeImage([
      [RED, BLUE],
      [CLEAR, RED],
    ]);
    const { columns, rows, pixels } = pixelate(image, 1);
    expect(columns).toBe(2);
    expect(rows).toBe(2);
    expect(pixels).toEqual([
      { r: 255, g: 0, b: 0, a: 255 },
      { r: 0, g: 0, b: 255, a: 255 },
      { r: 0, g: 0, b: 0, a: 0 },
      { r: 255, g: 0, b: 0, a: 255 },
    ]);
  });

  it("crops width and height to the nearest multiple of pixelSize", () => {
    const image = makeImage([
      [RED, RED, BLUE, BLUE, RED],
      [RED, RED, BLUE, BLUE, RED],
      [BLUE, BLUE, BLUE, BLUE, BLUE],
    ]);
    const { columns, rows, pixels } = pixelate(image, 2);
    expect(columns).toBe(2);
    expect(rows).toBe(1);
    // The 5th column and 3rd row are cropped away entirely.
    expect(pixels).toEqual([
      { r: 255, g: 0, b: 0, a: 255 },
      { r: 0, g: 0, b: 255, a: 255 },
    ]);
  });

  it("averages blocks independently across a multi-block grid", () => {
    const image = makeImage([
      [RED, BLUE],
      [RED, BLUE],
    ]);
    const { pixels } = pixelate(image, 1);
    expect(pixels[0]).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(pixels[1]).toEqual({ r: 0, g: 0, b: 255, a: 255 });
  });

  it("rejects a non-positive or non-finite pixelSize", () => {
    const image = makeImage([[RED]]);
    expect(() => pixelate(image, 0)).toThrow(RangeError);
    expect(() => pixelate(image, -3)).toThrow(RangeError);
    expect(() => pixelate(image, Number.NaN)).toThrow(RangeError);
  });
});

describe("toCSSColor", () => {
  it("emits opaque colors without an alpha component", () => {
    expect(toCSSColor({ r: 12, g: 200, b: 7, a: 255 })).toBe("rgb(12 200 7)");
  });

  it("scales alpha bytes to the CSS 0-1 range", () => {
    expect(toCSSColor({ r: 0, g: 0, b: 0, a: 0 })).toBe("rgb(0 0 0 / 0)");
    expect(toCSSColor({ r: 10, g: 20, b: 30, a: 51 })).toBe("rgb(10 20 30 / 0.2)");
  });
});
