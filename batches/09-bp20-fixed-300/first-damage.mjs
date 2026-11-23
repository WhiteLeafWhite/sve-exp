import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const rt = await import(pathToFileURL(resolve('dist/bp20-training-engine.mjs')).href);
const engine = rt.createEngine({cards:rt.ALL_CARDS, scripts:rt.ALL_SCRIPTS});
const opponents = {cQZr8Z:'破坏巫师', zQrwne:'侮蔑龙', t7B32v:'财宝皇室'};
const summary = [], examples = [];
for (const [key, name] of Object.entries(opponents)) {
  const losses = [], examplesFor = new Map();
  let allLosses = 0;
  for (let i = 1; i <= 100; i++) {
    const n = String(i).padStart(2,'0');
    const r = JSON.parse(readFileSync(join(root,key,'replays',n+'.json'),'utf8'));
    if (r.info.result.winner !== 1) continue;
    allLosses++;
    const g = engine.newGame({seed:r.options.seed,players:r.options.decks,config:rt.configOf(r.options)});
    const leader = g.state.players[0].zones.leader[0];
    const hits = [];
    let oppMain = false;
    for (const [at,{input,by}] of r.inputs.entries()) {
      for (const e of g.act(input,by??undefined)) {
        if (e.type === 'turnStarted') { hits.length = 0; oppMain = false; }
        if (e.type === 'phaseStarted' && e.phase === 'main') oppMain = e.player === 1;
        if (oppMain && e.type === 'damageDealt' && e.target === leader && e.amount > 0) {
          hits.push({at,amount:e.amount,kind:e.kind});
        }
      }
    }
    assert.deepEqual(g.result,r.info.result);
    if (g.result.losses[0].reason !== 'leaderDefense' || !oppMain || !hits.length) continue;
    const hp = g.state.players[0].leaderDefense, first = hits[0].amount;
    // The original game stopped at lethal. This calculation cannot observe
    // spare attacks, new targets or how the opponent would change sequencing.
    const aboveZero = hp + first > 0;
    losses.push({first,aboveZero});
    const label = aboveZero ? '抵消首段后帐面有血' : '抵消首段后仍到零';
    if (!examplesFor.has(label) && hits.length >= 3) {
      const sequence = hits.map(h=>`${h.amount}${h.kind==='ability'?'能力':'攻击'}`).join('、');
      examplesFor.set(label, `- ${name}第 ${i} 局 T${g.state.turn}，原顺序为 ${sequence}，终局 ${hp}。只把第一段加回，得到 ${hp+first}。从输入 ${hits[0].at} 前检查对手还有哪些随从或 EX 可用。[回合日志](${key}/games/${n}.md) · [原生录像](${key}/replays/${n}.json)`);
    }
  }
  const count = f => losses.filter(f).length;
  summary.push(`| ${name} | ${allLosses} | ${losses.length} | ${count(x=>x.first===1)} | ${count(x=>x.first===2)} | ${count(x=>x.first>=3)} | ${count(x=>x.aboveZero)} |`);
  examples.push(...examplesFor.values());
}
const lines = ['# 一次伤害防止能挡住哪一段','',
  '圣启梦羊（BP20-099）在对手主阶段开始时给主战者本回合一次伤害防止。用固定 B 的 300 局核对末回合，逐局读取对手主阶段开始后实际结算的第一段正伤害。最后一栏把原终局体力加回这段伤害，对方的其他动作均按原记录固定。实际打出梦羊需要卡位、费用和场位，对手也可以先用小伤害或改变路线。这一栏只能用来挑重练题。','',
  '| 对手 | 主教总败场 | 对手主阶段起至回合末被伤害击倒 | 首段 1 | 首段 2 | 首段 ≥3 | 原线路扣去首段后体力仍正 |','|---|---:|---:|---:|---:|---:|---:|',...summary,'',
  '局中先猜对方会用哪一段消耗防止，再看原顺序和后续伤害。相同体力下，先打 1 和先攻击 5 会留下不同的斩杀门槛。','',...examples,''];
writeFileSync(join(root,'first-damage.md'),lines.join('\n'));
console.log(summary.join('\n'));
