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
result.sourceWidth;  // the source image's natural dimensions,
result.sourceHeight; // before any cropping
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

| Attribute    | Description                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `src`        | URL of the image to divify.                                                                          |
| `pixel-size` | Same as the `pixelSize` option.                                                                      |
| `gap`        | Same as the `gap` option.                                                                            |
| `letterbox`  | Boolean. Reserve the source image's natural dimensions and center the grid inside them (see below).  |

The element re-renders whenever any of these attributes change, and caches
the decoded source pixels so that re-renders (say, dragging a `pixel-size`
slider) don't re-fetch and re-decode the image; changing `src` invalidates
the cache. To register it under a different tag name, import
`defineDivifiedImage` instead of relying on the side-effect registration.

By default the element shrink-wraps the rendered grid — and because the grid
is cropped to whole pixels, its size varies slightly with `pixel-size`. Add
the `letterbox` attribute when `pixel-size` changes dynamically: the element
holds the source image's natural dimensions as its content box and centers
the grid inside it, so the surrounding layout stays put while the grid
breathes. Letterboxing only stabilizes the element's footprint; it does not
make the grid responsive — a grid wider than its container still overflows
the same way it does today (downscale the source, or give the element an
`overflow-x` of your choosing).

The element's default `display: inline-block` (and the letterbox layout)
comes from the injected stylesheet, not inline styles, so your own CSS can
override it with a plain `divified-image { ... }` rule.

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
