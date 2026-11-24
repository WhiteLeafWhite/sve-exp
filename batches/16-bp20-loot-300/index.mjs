import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { archive, pad, protocol, read, save } from './game.mjs';
import { titles } from './report.mjs';

const byMatch = {};
for (const key of Object.keys(protocol.opponents)) {
  const root = join(archive, key, 'checks');
  const files = existsSync(root) ? readdirSync(root).filter(f => /^\d{3}\.json$/.test(f)).sort() : [];
  const all = [];
  let expected = 1;
  for (const f of files) {
    assert.equal(f, `${pad(expected)}.json`);
    const rows = read(join(root, f));
    assert.equal(rows.length, 10);
    for (const r of rows) assert.equal(r.number, expected++);
    all.push({ key: f.slice(0, 3), rows });
  }
  byMatch[key] = all;
}

const tally = rows => {
  const w = rows.filter(r => r.winner === 0).length;
  const l = rows.filter(r => r.winner === 1).length;
  return [w, l, rows.length - w - l];
};
const print = rows => rows.length ? `${tally(rows).join('–')}（${(100 * tally(rows)[0] / rows.length).toFixed(1)}%）` : '待开打';
const keys = Object.keys(byMatch);
const all = keys.flatMap(key => byMatch[key].flatMap(g => g.rows));
const lines = ['# 三组正式对战战绩', '',
  `已经重放核验 ${all.length}/300 局。成绩按我方胜–负–和排列。每个对局 100 局且至少 65 胜为目标。`, '',
  '| 对手 | 已完赛 | 总战绩 | 我方先攻 | 我方后攻 | 65 胜目标 |', '|---|---:|---:|---:|---:|---|'];
for (const key of keys) {
  const rows = byMatch[key].flatMap(g => g.rows);
  const w = tally(rows)[0];
  const target = w >= protocol.winTargetPerOpponent ? '已到 65 胜' : rows.length === protocol.gamesPerOpponent ? `差 ${protocol.winTargetPerOpponent - w} 胜` : '进行中';
  lines.push(`| ${titles[key]} ${protocol.opponents[key].key} | ${rows.length}/${protocol.gamesPerOpponent} | ${print(rows)} | ${print(rows.filter(r => r.first))} | ${print(rows.filter(r => !r.first))} | ${target} |`);
}
lines.push(`| 合计 | ${all.length}/300 | ${print(all)} | ${print(all.filter(r => r.first))} | ${print(all.filter(r => !r.first))} | |`);
for (const key of keys) {
  lines.push('', `## ${titles[key]}`, '');
  for (const group of byMatch[key]) {
    const rows = group.rows;
    const versions = [...new Set(rows.map(r => `r${r.pilot}`))].join('、');
    lines.push(`- 第 ${rows[0].number}–${rows.at(-1).number} 局，${print(rows)}，${versions}。[每局日志、录像和该批复盘](${key}/checks/${group.key}.md)`);
  }
}
lines.push('', '[对战约定与复现](README.md) · [财宝皇原表](decks/t7B32v.json)');
save(join(archive, 'index.md'), lines.join('\n') + '\n');
console.log(`${all.length}/300`, Object.fromEntries(keys.map(key => [key, tally(byMatch[key].flatMap(g => g.rows))])));
