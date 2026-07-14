/** Anything divify can pixelate. */
export type DivifySource = string | HTMLImageElement | HTMLCanvasElement | ImageData;

/**
 * Resolves any non-ImageData source to an ImageData by drawing it onto an
 * offscreen canvas. Exported so callers can extract pixels once and reuse
 * them across multiple divify() calls.
 *
 * String sources are loaded with `crossorigin="anonymous"` so that images
 * served with CORS headers don't taint the canvas.
 */
export async function loadImageData(
  source: Exclude<DivifySource, ImageData>,
): Promise<ImageData> {
  if (typeof source === "string") {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = source;
    await img.decode();
    return imageToData(img);
  }
  if (source instanceof HTMLCanvasElement) {
    const context = get2dContext(source);
    return context.getImageData(0, 0, source.width, source.height);
  }
  // decode() resolves immediately for already-loaded images, avoiding the
  // classic never-firing-onload bug with cached images.
  await source.decode();
  return imageToData(source);
}

/** True if the value quacks like ImageData (works cross-realm and in jsdom). */
export function isImageDataLike(value: unknown): value is ImageData {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Element) &&
    typeof (value as ImageData).width === "number" &&
    typeof (value as ImageData).height === "number" &&
    "data" in value
  );
}

function imageToData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = get2dContext(canvas);
  context.drawImage(img, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("divify: could not get a 2d canvas context");
  }
  return context;
}
