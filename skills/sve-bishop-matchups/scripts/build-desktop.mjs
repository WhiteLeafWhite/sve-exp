// Build an additional local SVE NEXT GUI under /practice/index.html.
// Run with Node from the installed 0.4.3 simulator checkout.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const sim = process.cwd(), gui = join(sim,"packages/gui");
const {positionals,values}=parseArgs({allowPositionals:true,options:{duels:{type:"string"},"if-changed":{type:"boolean"}}});
const pc = resolve(positionals[0] || "dist/pc");
const scripts = dirname(fileURLToPath(import.meta.url));
const duelDir=resolve(values.duels||join(scripts,"../../../batches/10-agent-duels"));
const policyFiles={"bishop":"pilots/bishop.mjs","meta":"pilots/meta.mjs","seat":"seat-strategy.mjs"};
const checked=join(duelDir,"checks");
const lastCheck=existsSync(checked) && readdirSync(checked).filter(n=>/^\d+\.json$/.test(n))
  .sort((a,b)=>parseInt(b)-parseInt(a)).find(n=>JSON.parse(readFileSync(join(checked,n),"utf8")).nextPolicies);
if(lastCheck) {
  const {nextPolicies}=JSON.parse(readFileSync(join(checked,lastCheck),"utf8"));
  for(const role of ["bishop","meta"]){
    const sha=nextPolicies[role];
    assert(/^[a-f0-9]{64}$/.test(sha),"Incomplete policy checkpoint: "+lastCheck);
    policyFiles[role]="pilots/history/"+sha+".mjs";
    assert.equal(createHash("sha256").update(readFileSync(join(duelDir,policyFiles[role]))).digest("hex"),sha);
  }
}
const policies=new Map();
if(Object.values(policyFiles).every(file=>existsSync(join(duelDir,file)))) {
  for(const [name,file] of Object.entries(policyFiles)) policies.set("virtual:sve-duel-"+name,readFileSync(join(duelDir,file),"utf8"));
}
if(values.duels) assert(policies.size===3,"A duel directory needs both pilot files and seat-strategy.mjs.");
assert(existsSync(join(pc,"server.mjs")),"Pass the installed PC release directory.");
const installed = readFileSync(join(pc,"VERSION.txt"),"utf8");
const fingerprint = installed.match(/Engine fingerprint: ([a-f0-9]+)/)?.[1];
assert(fingerprint && installed.includes("0.4.3"),"The practice GUI targets SVE NEXT 0.4.3.");
const hash=createHash("sha256").update(fingerprint).update(readFileSync(fileURLToPath(import.meta.url)))
  .update(readFileSync(join(scripts,"desktop-seat.mjs"))).update(readFileSync(join(scripts,"bishop-player.mjs")));
const policyIds={};
for(const [name,source] of policies) {
  hash.update(source);
  policyIds[name.slice("virtual:sve-duel-".length)]=createHash("sha256").update(source).digest("hex");
}
const id=hash.digest("hex").slice(0,16);
const manifest=join(pc,"app/practice/coaches.json");
const manifestText=JSON.stringify({engine:fingerprint,build:id,checkpoint:lastCheck||null,policies:policyIds},null,2)+"\n";
if(values["if-changed"] && existsSync(join(pc,"app/practice/index.html")) && existsSync(manifest)
   && JSON.parse(readFileSync(manifest,"utf8")).build===id) {
  if(readFileSync(manifest,"utf8")!==manifestText) writeFileSync(manifest,manifestText);
  console.log("Practice seats already match the archived strategies."); process.exit(0);
}
const fromSim = createRequire(join(sim,"package.json"));
const { build } = await import(pathToFileURL(fromSim.resolve("vite")).href);

const translations={
  zh:["BP20 主教陪练","给这个座位选择白牙萝蕾娜主教。它用本方可见信息练习对巫师、龙族、皇室的打法。其他职业组合会使用公平的中等 v2。"],
  en:["BP20 Haven coach","Choose the Whitefang–Lorena Haven deck for this seat. It plays from its own perspective against Rune, Dragon and Sword. Other class combinations use fair Medium v2."],
  ja:["BP20 ビショップ練習相手","この席に白牙・ロレーナのビショップを選びます。ウィッチ・ドラゴン・ロイヤルには公開情報と自分の手札で対応します。他の組み合わせはふつう v2 です。"]
};
const liveText={
  zh:["双席实战陪练","用两个实战席位积累的打法出牌。选择主教对破坏巫师、侮蔑龙或财宝皇室，任一方均可交给陪练。"],
  en:["Trained practice seats","Play either seat with the strategies from the recorded duels. Choose Haven against Rune, Dragon or Sword."],
  ja:["実戦トレーニング","記録された対戦で磨いた戦術を使います。ビショップ対ウィッチ・ドラゴン・ロイヤルのいずれの席も選べます。"]
};

function replaceOnce(code, old, replacement) {
  assert(code.includes(old) && code.indexOf(old)===code.lastIndexOf(old),"Unsupported upstream source: "+old);
  return code.replace(old,()=>replacement);
}
function coachPlugin() {
  return {
    name:"sve-bp20-practice", enforce:"pre",
    resolveId(name) {
      if (name==="virtual:sve-bp20-coach") return join(scripts,"desktop-seat.mjs");
      if (policies.has(name)) return "\0"+name;
    },
    load(id) { if(id.startsWith("\0virtual:sve-duel-")) return policies.get(id.slice(1)); },
    transform(code, file) {
      const path=file.replaceAll("\\","/");
      if (path.endsWith("/src/engine/game-host.ts")) {
        const original='import { createBot, createPresetBot, type BotPreset } from "@sve/bot";';
        const imports=['import { createBot, createPresetBot, PlannerBot, MEDIUM_V2, type BotPreset } from "@sve/bot";',
          'import { desktopBishop, desktopDuel } from "virtual:sve-bp20-coach";'];
        if(policies.size) imports.push('import { enumerateAnswers } from "@sve/core";',
          'import * as bishop from "virtual:sve-duel-bishop";','import * as meta from "virtual:sve-duel-meta";',
          'import { seatStrategy } from "virtual:sve-duel-seat";');
        code=replaceOnce(code,original,imports.join("\n"));
        const pivot="const recipe = botRecipe(controller, seed, seat, effort);";
        const controllers=['if (controller === "bishop-coach") return desktopBishop(engine, {PlannerBot,MEDIUM_V2,createPresetBot}, seat, seed);'];
        if(policies.size)controllers.push('if (controller === "duel-coach") return desktopDuel(engine,{PlannerBot,MEDIUM_V2,createPresetBot,enumerateAnswers},seat,seed,{bishop,meta,seatStrategy});');
        return replaceOnce(code,pivot,[...controllers,pivot].join("\n  "));
      }
      if (path.endsWith("/src/setup/SetupScreen.tsx")) {
        const choices=policies.size ? '"bishop-coach", "duel-coach"' : '"bishop-coach"';
        code=replaceOnce(code,'["human", "greedy", "medium", "medium-v2", "hard", "random"]','["human", '+choices+', "greedy", "medium", "medium-v2", "hard", "random"]');
        return replaceOnce(code,'["greedy", "medium", "medium-v2", "hard", "random", "human"]','['+choices+', "greedy", "medium", "medium-v2", "hard", "random", "human"]');
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
        const extra=['  "controller.bishop-coach": '+JSON.stringify(title)+',','  "controllerHint.bishop-coach": '+JSON.stringify(hint)+','];
        if(policies.size) extra.push('  "controller.duel-coach": '+JSON.stringify(liveText[lang][0])+',','  "controllerHint.duel-coach": '+JSON.stringify(liveText[lang][1])+',');
        return replaceOnce(code,marker,[...extra,marker].join("\n"));
      }
    }
  };
}
process.env.SVE_NO_ONLINE_SERVER="1";
await build({root:gui, configFile:join(gui,"vite.config.ts"), base:"/practice/", publicDir:false,
  plugins:[coachPlugin()], worker:{plugins:()=>[coachPlugin()]}, define:{__ENGINE_FINGERPRINT__:JSON.stringify(id)},
  build:{outDir:join(pc,"app/practice"),emptyOutDir:false}, logLevel:"warn"});
console.log("Installed BP20 practice GUI at /practice/index.html");
writeFileSync(manifest,manifestText);
