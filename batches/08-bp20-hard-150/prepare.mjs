// Run in an installed ShadowverseEvolve-NEXT checkout. Output is a local build artifact.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
const sim = process.cwd();
const requireFromGame = createRequire(join(sim, "package.json"));
const { build } = requireFromGame("esbuild");
mkdirSync("dist", { recursive: true });
await build({
  stdin: { contents: [
    'export {createEngine} from "@sve/core";',
    'export {ALL_CARDS,ALL_SCRIPTS} from "@sve/core/sets";',
    'export {createPresetBot,PlannerBot,MEDIUM_V2} from "@sve/bot";',
    'export {configOf} from "./packages/gui/src/engine/game-host.ts";',
    'export {parseDeckFile,toDeckList} from "./packages/gui/src/decks/format.ts";',
    'export {formatProblems} from "./packages/gui/src/formats/formats.ts";',
    'export {Catalog} from "./packages/gui/src/app/catalog.ts";',
    'export {engineFingerprint} from "./packages/gui/fingerprint.ts";',
  ].join("\n"), resolveDir: sim },
  platform: "node", format: "esm", target: "node22", bundle: true,
  outfile: resolve("dist/bp20-training-engine.mjs"), logLevel: "warning",
});
