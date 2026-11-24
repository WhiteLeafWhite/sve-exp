// Run from the simulator checkout. Publish one verified ten-game checkpoint at a time.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { archive, pad, protocolPath, read } from './field.mjs';
import { inspect, makeBlock, makeIndex, rowsFor, starts } from './report.mjs';

const root = resolve(archive, '..', '..');
const repoPath = p => relative(root, join(archive, p)).replaceAll('\\', '/');
const { decks } = read(protocolPath);
const slugs = Object.keys(decks);
const fixed = ['README.md', 'protocol.json', 'field.mjs', 'pilot.mjs', 'report.mjs', 'run.mjs', 'publish.mjs',
  ...slugs.flatMap(slug => [`${slug}/source.json`, `${slug}/deck.json`])];

const runGit = (args, stdio = 'pipe') => spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, stdio });
function git(...args) {
  const done = runGit(args);
  if (done.status !== 0) throw new Error(`git ${args[0]}: ${done.stderr || done.error}`);
  return done.stdout.trim();
}
const already = (slug, from) => runGit(['cat-file', '-e', `HEAD:${repoPath(`${slug}/checks/${pad(from)}.json`)}`], 'ignore').status === 0;
const numbers = from => Array.from({ length: 10 }, (_, i) => pad(from + i));
function ready(slug, from) {
  return numbers(from).every(n => existsSync(join(archive, slug, 'replays', n + '.json')));
}

function commit(slug, from) {
  assert(Object.hasOwn(decks, slug) && starts.includes(from));
  assert(ready(slug, from) && !already(slug, from));
  assert.equal(git('rev-parse', 'HEAD'), git('rev-parse', 'origin/main'));
  assert.equal(git('diff', '--cached', '--name-only'), '');
  const wins = makeBlock(slug, from);
  makeIndex();
  const prefix = pad(from);
  const files = ['index.md', ...fixed, `${slug}/checks/${prefix}.json`, `${slug}/checks/${prefix}.md`,
    ...numbers(from).flatMap(n => [`${slug}/games/${n}.md`, `${slug}/replays/${n}.json`])];
  git('-c', 'core.safecrlf=false', 'add', '--', ...files.map(repoPath));
  git('diff', '--cached', '--check');
  git('commit', '-q', '-m', `归档 BP20 ${decks[slug].title}对财宝皇 ${from}–${from + 9} 局（${wins} 胜）`);
  console.log(git('log', '-1', '--oneline'));
}

async function pushPending() {
  if (git('rev-parse', 'HEAD') === git('rev-parse', 'origin/main')) return;
  assert.match(git('log', '-1', '--format=%s'), /^归档 BP20 .*对财宝皇 /);
  assert.equal(git('rev-list', '--count', 'origin/main..HEAD'), '1');
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = runGit(['push', 'origin', 'HEAD:refs/heads/main'], 'inherit');
    if (result.status === 0) {
      assert.equal(git('rev-parse', 'HEAD'), git('rev-parse', 'origin/main'));
      return;
    }
    await setTimeout(3000);
  }
  throw new Error('GitHub did not accept the checkpoint after three attempts.');
}

async function follow() {
  await pushPending();
  const pause = resolve('../../analysis/practice/bp20-field/pause-publication');
  while (!existsSync(pause)) {
    const waiting = starts.flatMap(from => slugs.map(slug => ({ slug, from }))).filter(({ slug, from }) => !already(slug, from));
    if (!waiting.length) {
      console.log('400 局共 40 批已推送。');
      return;
    }
    const next = waiting.find(({ slug, from }) => ready(slug, from) && (from === 1 || already(slug, from - 10)));
    if (!next) {
      await setTimeout(3500);
      continue;
    }
    commit(next.slug, next.from);
    await pushPending();
  }
  throw new Error('Publication paused by the operator.');
}

function verifyAll() {
  const seeds = new Set();
  for (const slug of slugs) {
    const rows = rowsFor(slug);
    assert.equal(rows.length, 40, slug);
    assert.equal(rows.filter(row => row.first).length, 20, slug);
    for (let n = 1; n <= 40; n++) {
      const file = pad(n);
      const replay = read(join(archive, slug, 'replays', file + '.json'));
      assert(!seeds.has(replay.options.seed), replay.options.seed);
      seeds.add(replay.options.seed);
      assert.deepEqual(inspect(slug, n).summary, rows[n - 1]);
      assert(existsSync(join(archive, slug, 'games', file + '.md')));
    }
    console.log(`${slug} ${rows.filter(r => r.winner === 0 && r.first).length}/20 先、${rows.filter(r => r.winner === 0 && !r.first).length}/20 后`);
  }
  assert.equal(seeds.size, 400);
  console.log('400 种牌序、录像、逐局记录与十批次组别验证完成。');
}

const [command, slug, from] = process.argv.slice(2);
if (command === '--follow') await follow();
else if (command === '--one') commit(slug, Number(from));
else if (command === '--verify') verifyAll();
else if (command === '--index') makeIndex();
else throw new Error('Use --follow, --one <slug> <from>, --verify or --index.');
process.exit(0);
