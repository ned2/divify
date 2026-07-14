/**
 * The DOM-free core of divify: reducing an image's pixel data down to a
 * grid of averaged colors, one per output "pixel".
 */

/**
 * Structural subset of the DOM's ImageData, so the pixelation core can be
 * used (and tested) without a canvas or a DOM at all.
 */
export interface ImageDataLike {
  readonly width: number;
  readonly height: number;
  /** RGBA bytes, row-major, 4 per pixel, as returned by getImageData(). */
  readonly data: Uint8ClampedArray;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  /** Alpha in the 0–255 range, matching the source bytes. */
  a: number;
}

export interface PixelGrid {
  /** Number of output pixels per row. */
  columns: number;
  /** Number of output pixel rows. */
  rows: number;
  /** Averaged colors, row-major, length === columns * rows. */
  pixels: RGBA[];
}

/**
 * Reduces an image to a grid of `pixelSize`-sized blocks, each colored with
 * the average of every source pixel in its block. If the image dimensions
 * are not multiples of `pixelSize`, the right and bottom edges are cropped
 * to the nearest multiple.
 */
export function pixelate(image: ImageDataLike, pixelSize: number): PixelGrid {
  const size = Math.floor(pixelSize);
  if (!Number.isFinite(size) || size < 1) {
    throw new RangeError(`pixelSize must be a positive integer, got ${pixelSize}`);
  }

  const { width, height, data } = image;
  const columns = Math.floor(width / size);
  const rows = Math.floor(height / size);
  const samplesPerBlock = size * size;
  const pixels: RGBA[] = new Array(columns * rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let y = row * size; y < (row + 1) * size; y++) {
        let i = (y * width + col * size) * 4;
        for (let x = 0; x < size; x++, i += 4) {
          r += data[i]!;
          g += data[i + 1]!;
          b += data[i + 2]!;
          a += data[i + 3]!;
        }
      }
      pixels[row * columns + col] = {
        r: Math.round(r / samplesPerBlock),
        g: Math.round(g / samplesPerBlock),
        b: Math.round(b / samplesPerBlock),
        a: Math.round(a / samplesPerBlock),
      };
    }
  }

  return { columns, rows, pixels };
}

/** Formats an averaged color as a modern CSS color value. */
export function toCSSColor({ r, g, b, a }: RGBA): string {
  if (a === 255) {
    return `rgb(${r} ${g} ${b})`;
  }
  // Alpha bytes are 0–255 but CSS wants 0–1; three decimal places is
  // finer than the byte resolution.
  const alpha = Number((a / 255).toFixed(3));
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}
