// Build an additional local SVE NEXT GUI under /practice/index.html.
// Run with Node from the installed 0.4.3 simulator checkout.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const sim = process.cwd(), gui = join(sim,"packages/gui");
const pc = resolve(process.argv[2] || "dist/pc");
const scripts = dirname(fileURLToPath(import.meta.url));
assert(existsSync(join(pc,"server.mjs")),"Pass the installed PC release directory.");
const installed = readFileSync(join(pc,"VERSION.txt"),"utf8");
const fingerprint = installed.match(/Engine fingerprint: ([a-f0-9]+)/)?.[1];
assert(fingerprint && installed.includes("0.4.3"),"The practice GUI targets SVE NEXT 0.4.3.");
const id = createHash("sha256").update(fingerprint).update(readFileSync(join(scripts,"desktop-seat.mjs")))
  .update(readFileSync(join(scripts,"bishop-player.mjs"))).digest("hex").slice(0,16);
const fromSim = createRequire(join(sim,"package.json"));
const { build } = await import(pathToFileURL(fromSim.resolve("vite")).href);

const translations={
  zh:["BP20 主教陪练","给这个座位选择白牙萝蕾娜主教。它用本方可见信息练习对巫师、龙族、皇室的打法。其他职业组合会使用公平的中等 v2。"],
  en:["BP20 Haven coach","Choose the Whitefang–Lorena Haven deck for this seat. It plays from its own perspective against Rune, Dragon and Sword. Other class combinations use fair Medium v2."],
  ja:["BP20 ビショップ練習相手","この席に白牙・ロレーナのビショップを選びます。ウィッチ・ドラゴン・ロイヤルには公開情報と自分の手札で対応します。他の組み合わせはふつう v2 です。"]
};

function replaceOnce(code, old, replacement) {
  assert(code.includes(old) && code.indexOf(old)===code.lastIndexOf(old),"Unsupported upstream source: "+old);
  return code.replace(old,()=>replacement);
}
function coachPlugin() {
  return {
    name:"sve-bp20-practice", enforce:"pre",
    resolveId(name) { if (name==="virtual:sve-bp20-coach") return join(scripts,"desktop-seat.mjs"); },
    transform(code, file) {
      const path=file.replaceAll("\\","/");
      if (path.endsWith("/src/engine/game-host.ts")) {
        const original='import { createBot, createPresetBot, type BotPreset } from "@sve/bot";';
        code=replaceOnce(code,original,'import { createBot, createPresetBot, PlannerBot, MEDIUM_V2, type BotPreset } from "@sve/bot";\nimport { desktopBishop } from "virtual:sve-bp20-coach";');
        const pivot="const recipe = botRecipe(controller, seed, seat, effort);";
        return replaceOnce(code,pivot,'if (controller === "bishop-coach") return desktopBishop(engine, {PlannerBot,MEDIUM_V2,createPresetBot}, seat, seed);\n  '+pivot);
      }
      if (path.endsWith("/src/setup/SetupScreen.tsx")) {
        code=replaceOnce(code,'["human", "greedy", "medium", "medium-v2", "hard", "random"]','["human", "bishop-coach", "greedy", "medium", "medium-v2", "hard", "random"]');
        return replaceOnce(code,'["greedy", "medium", "medium-v2", "hard", "random", "human"]','["bishop-coach", "greedy", "medium", "medium-v2", "hard", "random", "human"]');
      }
      if (path.endsWith("/src/app/settings.ts")) {
        code=replaceOnce(code,'const KEY = "sve-gui-settings"','const KEY = "sve-bp20-practice-settings"');
        code=replaceOnce(code,'setupDecks: ["samples/sd01.json", "samples/sd02.json"]','setupDecks: ["svehelper/cQZr8Z.json", "BP20-Haven-final.json"]');
        code=replaceOnce(code,'setupControllers: ["human", "medium"]','setupControllers: ["human", "bishop-coach"]');
        return replaceOnce(code,'restrictionLists: {},','restrictionLists: {standard:null},');
      }
      const lang=path.match(/\/src\/i18n\/(en|zh|ja)\.ts$/)?.[1];
      if (lang) {
        const [title,hint]=translations[lang];
        const marker='  "controller.hard":';
        return replaceOnce(code,marker,'  "controller.bishop-coach": '+JSON.stringify(title)+',\n  "controllerHint.bishop-coach": '+JSON.stringify(hint)+',\n'+marker);
      }
    }
  };
}
process.env.SVE_NO_ONLINE_SERVER="1";
await build({root:gui, configFile:join(gui,"vite.config.ts"), base:"/practice/", publicDir:false,
  plugins:[coachPlugin()], worker:{plugins:()=>[coachPlugin()]}, define:{__ENGINE_FINGERPRINT__:JSON.stringify(id)},
  build:{outDir:join(pc,"app/practice"),emptyOutDir:false}, logLevel:"warn"});
console.log("Installed BP20 practice GUI at /practice/index.html");
