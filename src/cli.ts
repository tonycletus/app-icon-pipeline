#!/usr/bin/env node
import { Command } from "commander";
import { generateAppIcons } from "./index.js";

const program = new Command()
  .name("app-icon-pipeline")
  .description("Generate PWA, Apple, favicon, and Windows ICO icons from one source image.")
  .requiredOption("-i, --input <path>", "source PNG/SVG/JPG image")
  .requiredOption("-o, --out <dir>", "output directory")
  .option("-n, --name <name>", "app name", "App")
  .option("--background <color>", "manifest background color", "#ffffff")
  .option("--theme <color>", "manifest theme color", "#0a0a0b")
  .option("--ico <path>", "custom Windows ICO output path")
  .action(async (options) => {
    const generated = await generateAppIcons({
      input: options.input,
      outDir: options.out,
      name: options.name,
      background: options.background,
      themeColor: options.theme,
      icoPath: options.ico,
    });
    for (const file of Object.values(generated)) {
      console.log(file);
    }
  });

await program.parseAsync();
