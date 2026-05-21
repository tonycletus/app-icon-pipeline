import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export type GenerateAppIconsOptions = {
  input: string;
  outDir: string;
  name?: string;
  background?: string;
  themeColor?: string;
  icoPath?: string;
};

export type GeneratedAppIcons = {
  png192: string;
  png512: string;
  appleTouchIcon: string;
  faviconSvg: string;
  manifest: string;
  ico: string;
};

const pngSizes = {
  png192: 192,
  png512: 512,
  appleTouchIcon: 180,
} as const;

const icoSizes = [16, 24, 32, 48, 64, 128, 256] as const;

export async function generateAppIcons(options: GenerateAppIconsOptions): Promise<GeneratedAppIcons> {
  const name = options.name ?? "App";
  const background = options.background ?? "#ffffff";
  const themeColor = options.themeColor ?? "#0a0a0b";
  const outDir = path.resolve(options.outDir);
  await mkdir(outDir, { recursive: true });

  const png192 = path.join(outDir, "icon-192.png");
  const png512 = path.join(outDir, "icon-512.png");
  const appleTouchIcon = path.join(outDir, "apple-touch-icon.png");
  const faviconSvg = path.join(outDir, "favicon.svg");
  const manifest = path.join(outDir, "manifest.webmanifest");
  const ico = path.resolve(options.icoPath ?? path.join(outDir, "favicon.ico"));

  await Promise.all([
    resizePng(options.input, png192, pngSizes.png192),
    resizePng(options.input, png512, pngSizes.png512),
    resizePng(options.input, appleTouchIcon, pngSizes.appleTouchIcon),
  ]);

  await writeFile(faviconSvg, buildFaviconSvg(name, themeColor), "utf8");
  await writeFile(
    manifest,
    JSON.stringify(
      {
        name,
        short_name: name,
        start_url: "/",
        display: "standalone",
        background_color: background,
        theme_color: themeColor,
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeWindowsIco(options.input, ico);

  return { png192, png512, appleTouchIcon, faviconSvg, manifest, ico };
}

async function resizePng(input: string, output: string, size: number): Promise<void> {
  await sharp(input)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(output);
}

async function writeWindowsIco(input: string, output: string): Promise<void> {
  await mkdir(path.dirname(output), { recursive: true });
  const entries: Array<{ width: number; height: number; payload: Buffer }> = [];

  for (const size of icoSizes) {
    const raw = await sharp(input)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer();
    entries.push({ width: size, height: size, payload: dibFromRgba(raw, size, size) });
  }

  const headerSize = 6 + entries.length * 16;
  let offset = headerSize;
  const directory = Buffer.alloc(entries.length * 16);
  const payloads: Buffer[] = [];

  entries.forEach((entry, index) => {
    const entryOffset = index * 16;
    directory.writeUInt8(entry.width === 256 ? 0 : entry.width, entryOffset);
    directory.writeUInt8(entry.height === 256 ? 0 : entry.height, entryOffset + 1);
    directory.writeUInt8(0, entryOffset + 2);
    directory.writeUInt8(0, entryOffset + 3);
    directory.writeUInt16LE(1, entryOffset + 4);
    directory.writeUInt16LE(32, entryOffset + 6);
    directory.writeUInt32LE(entry.payload.length, entryOffset + 8);
    directory.writeUInt32LE(offset, entryOffset + 12);
    payloads.push(entry.payload);
    offset += entry.payload.length;
  });

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  await writeFile(output, Buffer.concat([header, directory, ...payloads]));
}

function dibFromRgba(rgba: Buffer, width: number, height: number): Buffer {
  const xorStride = width * 4;
  const maskStride = Math.ceil(width / 32) * 4;
  const xor = Buffer.alloc(xorStride * height);
  const mask = Buffer.alloc(maskStride * height);

  for (let y = 0; y < height; y += 1) {
    const sourceY = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const source = (sourceY * width + x) * 4;
      const target = y * xorStride + x * 4;
      const red = rgba[source] ?? 0;
      const green = rgba[source + 1] ?? 0;
      const blue = rgba[source + 2] ?? 0;
      const alpha = rgba[source + 3] ?? 255;
      xor[target] = blue;
      xor[target + 1] = green;
      xor[target + 2] = red;
      xor[target + 3] = alpha;
      if (alpha < 128) {
        const maskByte = y * maskStride + Math.floor(x / 8);
        mask[maskByte] = (mask[maskByte] ?? 0) | (0x80 >> (x % 8));
      }
    }
  }

  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(width, 4);
  header.writeInt32LE(height * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(xor.length + mask.length, 20);
  return Buffer.concat([header, xor, mask]);
}

function buildFaviconSvg(name: string, color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeXml(name)}">
  <rect width="64" height="64" rx="14" fill="${escapeXml(color)}"/>
  <circle cx="32" cy="32" r="13" fill="#fff"/>
  <circle cx="47" cy="17" r="6" fill="#22c55e"/>
</svg>
`;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
