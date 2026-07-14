# divify

A whimsical JavaScript tool for pixelating an image into a grid of divs,
rendered with nothing but CSS. Each "pixel" is a div whose background color is
the average color of that block of the original image, laid out with CSS Grid.

Why would you want this? Unclear! But here we are.

## Install

```sh
npm install divify
```

ESM-only, TypeScript types included, zero runtime dependencies.

## Usage

### Function API

```js
import { divify } from "divify";

const result = await divify(document.querySelector("#target"), "photo.jpg", {
  pixelSize: 8,
  gap: "1px",
  pixelStyles: { "border-radius": "4px" },
});

result.getHTML(); // serialized markup of the divified image
result.getCSS();  // all CSS needed to render it standalone
```

The source can be an image URL, an `<img>` element, a `<canvas>` element, or
an `ImageData` object. To pixelate the same image repeatedly without
reloading it, extract its pixels once:

```js
import { divify, loadImageData } from "divify";

const imageData = await loadImageData("photo.jpg");
await divify(one, imageData, { pixelSize: 4 });
await divify(two, imageData, { pixelSize: 16 });
```

### Options

| Option        | Type                     | Default | Description                                                                 |
| ------------- | ------------------------ | ------- | --------------------------------------------------------------------------- |
| `pixelSize`   | `number`                 | `10`    | Side length of each output pixel in CSS px. `1` is valid; brace yourself.   |
| `gap`         | `string`                 | —       | Space between pixels (any CSS `gap` value).                                 |
| `pixelStyles` | `Record<string, string>` | —       | CSS declarations applied to every pixel div, e.g. `{ border: "1px solid" }`.|

If the image dimensions aren't multiples of `pixelSize`, the right and bottom
edges are cropped to the nearest multiple.

### Web component

```html
<script type="module">
  import "divify/element";
</script>

<divified-image src="photo.jpg" pixel-size="8" gap="1px"></divified-image>
```

The element re-renders whenever its `src`, `pixel-size`, or `gap` attributes
change. To register it under a different tag name, import
`defineDivifiedImage` instead of relying on the side-effect registration.

## How it works

The image is drawn to an offscreen canvas, its pixels are read with
`getImageData()`, and each `pixelSize × pixelSize` block is averaged into a
single color. The result is one container div using CSS Grid
(`grid-template-columns: repeat(var(--divify-cols), var(--divify-pixel-size))`)
full of empty divs with background colors. Pixel styling goes through real
stylesheets scoped by a `data-divify` attribute, so divified images stay easy
to restyle after the fact.

Cross-origin image URLs are loaded with `crossorigin="anonymous"`, so the
server must send CORS headers (otherwise the canvas would be tainted and
pixels unreadable).

## Demo

```sh
npm install
npm run dev
```

## v2 breaking changes

v2 is a full TypeScript rewrite with a new API:

- `divifyImage()` and `imageToCanvas()` are replaced by `divify()` (async)
  and `loadImageData()`. No more globals.
- Layout uses CSS Grid instead of floats; use `gap` instead of the old
  `margin` style for spacing.
- Blocks are now averaged over the **full** pixel block (v1 sampled only one
  row and one column per block), so colors may differ slightly.
- `divify()` replaces the target's children instead of prepending to them.
