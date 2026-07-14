import { divify, loadImageData, type DivifyResult } from "divify";
import "divify/element";

const $ = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`demo: missing element ${selector}`);
  return element;
};

/* Draw the demo image onto the visible canvas, then divify it seven ways
 * from a single ImageData extraction. */
async function renderExamples(): Promise<void> {
  const img = new Image();
  img.src = "/george_small.jpg";
  await img.decode();

  const canvas = $<HTMLCanvasElement>("#original");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);

  const imageData = await loadImageData(canvas);

  await divify($("#pix1"), imageData, { pixelSize: 5 });
  await divify($("#pix2"), imageData, { pixelSize: 10 });
  await divify($("#pix3"), imageData, {
    pixelSize: 5,
    pixelStyles: { "border-radius": "5px" },
  });
  await divify($("#pix4"), imageData, { pixelSize: 5, gap: "2px" });
  await divify($("#pix5"), imageData, {
    pixelSize: 5,
    pixelStyles: { border: "1px solid black" },
  });
  await divify($("#pix6"), imageData, {
    pixelSize: 5,
    gap: "2px",
    pixelStyles: { border: "1px solid black" },
  });
  await divify($("#pix7"), imageData, {
    pixelSize: 10,
    gap: "1px",
    pixelStyles: {
      "border-radius": "5px",
      "box-shadow": "3px 3px 3px rgb(0 0 0 / 0.5)",
    },
  });
}

/* Live pixel-size control for the <divified-image> example. */
function wireElementDemo(): void {
  const slider = $<HTMLInputElement>("#element-pixel-size");
  const output = $<HTMLOutputElement>("#element-pixel-size-value");
  const element = $("divified-image");
  slider.addEventListener("input", () => {
    output.value = slider.value;
    element.setAttribute("pixel-size", slider.value);
  });
}

/* The divify-your-own-image form. */
function wireForm(): void {
  const fileInput = $<HTMLInputElement>("#divify-file-input");
  const pixelSizeInput = $<HTMLInputElement>("#pixel-size-input");
  const htmlButton = $<HTMLButtonElement>("#get-html");
  const cssButton = $<HTMLButtonElement>("#get-css");
  const htmlDialog = $<HTMLDialogElement>("#html-dialog");
  const cssDialog = $<HTMLDialogElement>("#css-dialog");

  let uploaded: HTMLImageElement | null = null;
  let result: DivifyResult | null = null;

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    uploaded = new Image();
    uploaded.src = URL.createObjectURL(file);
    await uploaded.decode();
    $("#image-width").textContent = `${uploaded.naturalWidth}px`;
    $("#image-height").textContent = `${uploaded.naturalHeight}px`;
  });

  $("#divify-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!uploaded) return;
    const pixelSize = Number(pixelSizeInput.value) || 10;
    result = await divify($("#user-pix"), uploaded, { pixelSize });
    htmlButton.hidden = false;
    cssButton.hidden = false;
  });

  htmlButton.addEventListener("click", () => {
    htmlDialog.querySelector("textarea")!.value = result?.getHTML() ?? "";
    htmlDialog.showModal();
  });

  cssButton.addEventListener("click", () => {
    cssDialog.querySelector("textarea")!.value = result?.getCSS() ?? "";
    cssDialog.showModal();
  });
}

wireElementDemo();
wireForm();
void renderExamples();
