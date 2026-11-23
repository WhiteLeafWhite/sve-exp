// From the simulator checkout: node <this file> cQZr8Z 1 A 2
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const [key, round, deck, policy, series = "explore"] = process.argv.slice(2);
const unit = Number(round);
assert(["explore", "fixed100"].includes(series) && Number.isInteger(unit) && unit >= 1 && unit <= (series === "fixed100" ? 20 : 10) && deck && policy);
const worker = fileURLToPath(new URL("./game.mjs", import.meta.url));
const games = Array.from({ length: 5 }, (_, j) => (unit - 1) * 5 + j + 1);
const done = await Promise.all(games.map((i) => new Promise((ok) => {
  const proc = spawn(process.execPath, [worker, key, String(i), deck, policy, series], { stdio: "inherit", windowsHide: true });
  proc.on("error", (e) => { console.error(e); ok(false); });
  proc.on("close", (code) => ok(code === 0));
})));
if (done.includes(false)) process.exitCode = 1;
