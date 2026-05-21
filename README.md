# @tonycletus/app-icon-pipeline

Generate production-ready app icons from one source image.

Use this when you want the same brand image to power your PWA icons, Apple
touch icon, favicon, web manifest, and Windows installer icon without keeping
several hand-made assets in sync.

It creates:

- `icon-192.png`
- `icon-512.png`
- `apple-touch-icon.png`
- `favicon.svg`
- `manifest.webmanifest`
- Windows-compatible `.ico` with DIB/BMP entries, not PNG-compressed entries.

## Install

```bash
npm install -D @tonycletus/app-icon-pipeline
pnpm add -D @tonycletus/app-icon-pipeline
yarn add -D @tonycletus/app-icon-pipeline
```

## CLI

```bash
npx app-icon-pipeline --input ./brand.png --out ./public --name "My App"
```

You can also write the Windows `.ico` file wherever your desktop build expects
it:

```bash
npx app-icon-pipeline \
  --input ./brand.png \
  --out ./public \
  --name "My App" \
  --ico ./installer/windows/app.ico
```

## API

```ts
import { generateAppIcons } from "@tonycletus/app-icon-pipeline";

await generateAppIcons({
  input: "./brand.png",
  outDir: "./public",
  name: "My App",
  icoPath: "./installer/windows/app.ico",
});
```

## Source Image

For best results, start with a square PNG of at least `512x512`. Transparent
backgrounds are supported. The package resizes and pads the image as needed, so
your source can be a logo mark, app icon, or brand image.

## Generated Files

By default the output directory receives:

- `icon-192.png` for Android/PWA installs
- `icon-512.png` for high resolution PWA installs
- `apple-touch-icon.png` for iOS home screen installs
- `favicon.svg` for browser tabs
- `manifest.webmanifest` with the app name and icon references

When `--ico` or `icoPath` is provided, it also writes a Windows-compatible ICO
file with BMP/DIB icon entries. That format works well with installers and
Windows desktop shortcuts.

## Notes

This package does not design an icon for you. It takes one source image and
generates the platform-specific formats that apps and installers expect.
