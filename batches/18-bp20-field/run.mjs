// Run from the pinned SVE NEXT checkout. Each worker handles one fresh rules-engine game.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { availableParallelism, constants, setPriority } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const archive = dirname(fileURLToPath(import.meta.url));
const slugs = ['hunter', 'fairy', 'rally', 'destruction', 'truth', 'disdain', 'ocean', 'choice', 'bat', 'crest'];
const count = Number(process.env.SVE_FIELD_WORKERS ?? Math.min(14, Math.max(1, availableParallelism() - 2)));
assert(Number.isInteger(count) && count > 0);
const only = process.argv.slice(2);
assert(only.every(slug => slugs.includes(slug)));
const selected = only.length ? [...new Set(only)] : slugs;
const pause = resolve('../../analysis/practice/bp20-field/pause');
const queue = [];
for (let start = 1; start <= 31; start += 10) {
  for (const slug of selected) {
    for (let n = start; n < start + 10; n++) {
      const file = join(archive, slug, 'replays', String(n).padStart(3, '0') + '.json');
      if (!existsSync(file)) queue.push([slug, n]);
    }
  }
}
console.log(`开始 ${queue.length} 局，${count} 并行`);
const failed = [];

function run(slug, number) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [join(archive, 'field.mjs'), slug, String(number)], { windowsHide: true, stdio: 'inherit' });
    child.once('spawn', () => {
      try { setPriority(child.pid, constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* Keep default priority. */ }
    });
    child.once('error', error => { failed.push([slug, number, error.message]); resolve(); });
    child.once('close', code => { if (code !== 0) failed.push([slug, number, code]); resolve(); });
  });
}

async function games() {
  while (queue.length && !existsSync(pause)) await run(...queue.shift());
}
await Promise.all(Array.from({ length: Math.min(count, queue.length) }, games));
assert.deepEqual(failed, []);
assert.equal(queue.length, 0, '剩余对局暂停');
console.log('已完成所选组别，原生录像已生成');
