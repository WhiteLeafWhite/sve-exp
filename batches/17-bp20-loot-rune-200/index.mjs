import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { extraArchive, pad, read, save } from '../16-bp20-loot-300/game.mjs';

const protocol = read(join(extraArchive, 'protocol.json'));
const checks = join(extraArchive, 'rune', 'checks');
const files = existsSync(checks) ? readdirSync(checks).filter(f => /^\d{3}\.json$/.test(f)).sort() : [];
const entries = [];
for (const f of files) {
  const first = Number(f.slice(0, 3));
  assert(first >= 1 && first < protocol.games && first % 10 === 1);
  const rows = read(join(checks, f));
  assert.equal(rows.length, 10);
  for (const [index, r] of rows.entries()) assert.equal(r.number, first + index);
  entries.push(rows);
}
const all = entries.flat();
assert(all.length <= protocol.games);
const fit = all.filter(r => r.number < protocol.validationStart);
const test = all.filter(r => r.number >= protocol.validationStart);
const wins = rows => rows.filter(r => r.winner === 0).length;
const result = rows => {
  const w = wins(rows), l = rows.filter(r => r.winner === 1).length;
  return rows.length ? `${w}–${l}–${rows.length - w - l}（${(100 * w / rows.length).toFixed(1)}%）` : '待开打';
};
const ids = [...new Set(all.map(r => r.pilot))].sort((a, b) => a - b);
const countLine = (scope, rows) => `| ${scope} | ${rows.length} | ${result(rows)} | ${result(rows.filter(r => r.first))} | ${result(rows.filter(r => !r.first))} |`;
const lines = [ '# 财宝皇对破坏法加练战绩', '',
  `已重放核验 ${all.length}/${protocol.games} 局。目标 ${protocol.targetWins} 胜，当前 ${wins(all)} 胜。表内顺序为胜–负–和。`, '',
  '| 范围 | 完赛 | 总战绩 | 我方先攻 | 我方后攻 |', '|---|---:|---:|---:|---:|',
  countLine('全部', all), countLine('迭代 1–160', fit), countLine('验证 161–200', test),
  ...ids.map(id => countLine(`打法 r${id}`, all.filter(r => r.pilot === id))),
  '', '## 每十局的录像、日志和复盘', '',
];
for (const group of entries) {
  const start = group[0].number, end = group.at(-1).number;
  const revisions = [...new Set(group.map(r => `r${r.pilot}`))].join('、');
  lines.push(`- 第 ${start}–${end} 局，${result(group)}，${revisions}。[日志、录像和复盘](rune/checks/${pad(start)}.md)`);
}
const review = existsSync(join(extraArchive, 'review.md')) ? ' · [收官复盘](review.md)' : '';
lines.push('', '[牌表与对战约定](README.md) · [打法迭代](decisions.md)' + review);
save(join(extraArchive, 'index.md'), lines.join('\n') + '\n');
console.log(`加练 ${all.length}/${protocol.games}，${wins(all)} 胜，验证 ${wins(test)}/${test.length}`);
