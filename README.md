# @tonycletus/app-icon-pipeline

Generate app icons from one source image.

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
```

## CLI

```bash
app-icon-pipeline --input ./brand.png --out ./public --name PeerDrift
```

## API

```ts
import { generateAppIcons } from "@tonycletus/app-icon-pipeline";

await generateAppIcons({
  input: "./brand.png",
  outDir: "./public",
  name: "PeerDrift",
});
```
