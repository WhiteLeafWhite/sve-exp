// From the pinned simulator checkout. A block is ten new games against one fixed deck.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { availableParallelism, constants, setPriority } from 'node:os';
import { fileURLToPath } from 'node:url';

const [matchups, startText, countText, revision, trial = ''] = process.argv.slice(2);
const start = Number(startText), count = Number(countText);
const keys = matchups.split(',');
assert(keys.every(k => ['dragon', 'rune', 'mirror'].includes(k)));
assert(Number.isInteger(start) && Number.isInteger(count) && start >= 1 && count >= 1 && start + count <= 101);
assert(trial || (start % 10 === 1 && count === 10 && keys.length === 1));
const script = fileURLToPath(new URL('./game.mjs', import.meta.url));
const queue = Array.from({ length: count }, (_, i) => keys.map(key => [key, String(start + i)])).flat();
const failures = [];
const run = args => new Promise(resolve => {
  const child = spawn(process.execPath, [script, ...args, revision, trial], { windowsHide: true, stdio: 'inherit' });
  child.once('spawn', () => {
    try { setPriority(child.pid, constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* Scheduling can stay at its default. */ }
  });
  child.once('error', error => { failures.push([...args, error.message]); resolve(); });
  child.once('close', code => { if (code !== 0) failures.push([...args, `exit ${code}`]); resolve(); });
});

async function work() {
  while (queue.length) await run(queue.shift());
}

const workers = Number(process.env.SVE_LOOT_GAME_WORKERS ?? 8);
assert(Number.isInteger(workers) && workers > 0);
await Promise.all(Array.from({ length: Math.min(queue.length, Math.max(1, availableParallelism() - 2), workers) }, work));
assert.deepEqual(failures, []);
