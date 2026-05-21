import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { generateAppIcons } from "./index";

describe("generateAppIcons", () => {
  it("generates png, manifest, svg, and classic ico assets", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "app-icon-pipeline-"));
    try {
      const input = path.join(dir, "source.png");
      await sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: "#0a0a0b",
        },
      })
        .png()
        .toBuffer()
        .then((buffer) => writeFile(input, buffer));

      const result = await generateAppIcons({ input, outDir: dir, name: "Demo" });
      const ico = await readFile(result.ico);
      expect(await readFile(result.manifest, "utf8")).toContain('"name": "Demo"');
      expect(ico.readUInt16LE(2)).toBe(1);
      expect(ico.readUInt16LE(4)).toBe(7);
      expect(ico.subarray(6 + 16 * 7, 6 + 16 * 7 + 4).readUInt32LE()).toBe(40);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
