// Run from the installed SVE NEXT checkout used for the archived series.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const { build } = createRequire(resolve('package.json'))('esbuild');
await build({
  stdin: {
    contents: [
      'export {createEngine,enumerateAnswers,validateAnswer} from "@sve/core";',
      'export {ALL_CARDS,ALL_SCRIPTS} from "@sve/core/sets";',
      'export {createPresetBot, PlannerBot, MEDIUM_V2, MEDIUM_NEXT, evaluate, DEFAULT_WEIGHTS, fixOptions} from "@sve/bot";',
      'export {configOf} from "./packages/gui/src/engine/game-host.ts";',
      'export {parseDeckFile,toDeckList} from "./packages/gui/src/decks/format.ts";',
      'export {formatProblems} from "./packages/gui/src/formats/formats.ts";',
      'export {Catalog} from "./packages/gui/src/app/catalog.ts";',
      'export {engineFingerprint} from "./packages/gui/fingerprint.ts";',
    ].join('\n'),
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: 'dist/bp20-loot-engine.mjs',
  logLevel: 'warning',
});
