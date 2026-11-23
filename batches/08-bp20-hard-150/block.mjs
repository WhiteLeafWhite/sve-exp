// From the simulator checkout: node <this file> cQZr8Z 1 A 2
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { constants as osConstants, setPriority } from "node:os";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
const [key, round, deck, policy, series = "explore"] = process.argv.slice(2);
const unit = Number(round);
const rounds={explore:10, fixed100:20, lyrial:1, dragonPolicy:1, banish:1, opening:20, openingControl:10, secondSaito:20, saitoControl:20, sheep:2, trained:4, knight:10, knightControl:10};
assert(Object.hasOwn(rounds,series) && Number.isInteger(unit) && unit >= 1 && unit <= rounds[series] && deck && policy);
// A supervised run can wait for its five-game quota/skill/publication checkpoint.
// Offline reproduction needs no account access and uses no control directory.
const gates = resolve("dist/quota-checkpoints");
if (series === "fixed100" && existsSync(resolve(gates,"active"))) {
  while (!existsSync(resolve(gates,key+"-"+unit+".go"))) {
    if (existsSync(resolve(gates,"stop"))) process.exit(3);
    await delay(1500);
  }
  if (existsSync(resolve(gates,"stop"))) process.exit(3);
}
const worker = fileURLToPath(new URL("./game.mjs", import.meta.url));
const games = Array.from({ length: 5 }, (_, j) => (unit - 1) * 5 + j + 1);
const done = await Promise.all(games.map((i) => new Promise((ok) => {
  const proc = spawn(process.execPath, [worker, key, String(i), deck, policy, series], { stdio: "inherit", windowsHide: true });
  if(["opening","openingControl","secondSaito","saitoControl","sheep","trained","knight","knightControl"].includes(series)){
    // These held-out games run beside the live practice table. Scheduling only
    // changes their share of the CPU, not the planner's fixed search budget.
    proc.once("spawn",()=>{try{setPriority(proc.pid,osConstants.priority.PRIORITY_BELOW_NORMAL)}catch{}});
  }
  proc.on("error", (e) => { console.error(e); ok(false); });
  proc.on("close", (code) => ok(code === 0));
})));
if (done.includes(false)) process.exitCode = 1;
