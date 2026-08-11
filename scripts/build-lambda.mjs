import { build } from "esbuild";

await build({
  entryPoints: ["api/index.ts"],
  outfile: "api/index.js",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  minify: true,
  logLevel: "info",
});
