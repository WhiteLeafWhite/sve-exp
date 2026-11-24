import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { archive, engine, pad, profile, protocolPath, read, save, start, verifyHeader } from './field.mjs';

const flags = 'BP19-T01';
const mainThreats = new Set(['BP19-019', 'BP19-026', 'BP15-020', 'BP05-018']);
const names = new Map();
export function name(def) {
  if (!def) return '能力';
  if (!names.has(def)) names.set(def, engine.db.has(def) ? engine.db.get(def).names.cn || engine.db.get(def).name : def);
  return names.get(def);
}
export const resultLabel = w => w === 0 ? '胜' : w === 1 ? '负' : '和';
export const starts = [1, 11, 21, 31];
const hp = pair => pair.join('／');

export function inspect(slug, number) {
  const p = profile(slug), key = pad(number);
  const replay = read(join(archive, slug, 'replays', key + '.json'));
  verifyHeader(replay, slug, number);
  const game = start(replay.options);
  const label = [p.title, '困难财宝皇'];
  const leaders = game.state.players.map(s => s.zones.leader[0]);
  const defs = new Map();
  const cardDef = id => game.state.cards[id]?.def ?? defs.get(id);
  const card = id => leaders.includes(id) ? label[leaders.indexOf(id)] + '主战者' : name(cardDef(id));
  const openings = [], redraws = [], turns = [], uses = [], shifts = [], removals = [], attacks = [];
  const blood = [20, 20];
  let at = -1, turn;
  const log = line => { if (turn) turn.log.push(`- 输入 ${at}，${line}`); };

  function describe(a) {
    if (a.type === 'attack') return `用${card(a.attacker)}攻击${card(a.target)}`;
    if (a.type === 'play') return `使用${card(a.card)}`;
    if (a.type === 'evolve') return `${a.superEvolve ? '超进化' : '进化'}${card(a.card)}${a.useEvolutionPoint ? '（EP）' : ''}`;
    if (a.type === 'activate') return `起动${card(a.card)}的能力 ${a.ability}`;
    if (a.type === 'endMainPhase') return '结束主阶段';
    if (a.type === 'pass') return '让过 Quick';
    return a.type;
  }

  function record(events) {
    for (const e of events) {
      if (e.type === 'turnStarted') {
        turn = { turn: e.turn, side: e.player, at: at + 1, before: [...blood], after: [...blood],
          damage: [0, 0], heals: [0, 0], log: [], choices: [], damageDetail: [] };
        turns.push(turn);
      } else if (e.type === 'cardsMoved') {
        for (const m of e.moves) {
          if (m.card) defs.set(m.card, m.def);
          if (m.newCard) defs.set(m.newCard, m.def);
          if (!turn) continue;
          const from = m.from?.zone, to = m.to.zone;
          if (to === 'ex') {
            const stolen = from === 'cemetery' && m.from.player !== m.to.player;
            log(`${label[m.to.player]}${stolen ? '从对手墓场' : ''}将${name(m.def)}置于 EX。`);
            if (stolen) uses.push({ at, turn: turn.turn, side: m.to.player, how: 'steal', def: m.def });
          } else if (to === 'field' && from !== 'resolution') {
            log(`${label[m.to.player]}将${name(m.def)}置于场上。`);
            uses.push({ at, turn: turn.turn, side: m.to.player, how: 'enter', def: m.def });
          } else if (to === 'hand' && m.to.player === 0) {
            log(`我方将${name(m.def)}加入手牌。`);
          } else if (from === 'field' && ['cemetery', 'banished', 'hand'].includes(to)) {
            const change = { cemetery: '进入墓场', banished: '被消灭', hand: '回到手牌' };
            log(`${label[m.from.player]}的${name(m.def)}${change[to]}。`);
            removals.push({ at, turn: turn.turn, side: m.from.player, how: to, def: m.def, by: m.cause?.def ?? null });
          }
        }
      } else if (turn && e.type === 'cardPlayed') {
        const d = eventDecision;
        const how = d?.type === 'quick' ? 'quick' : 'play';
        log(`${label[e.player]}${how === 'quick' ? '以 Quick ' : ''}从${e.from === 'hand' ? '手牌' : e.from === 'ex' ? ' EX ' : e.from}使用${name(e.def)}。`);
        uses.push({ at, turn: turn.turn, side: e.player, how, def: e.def });
      } else if (turn && e.type === 'evolved') {
        const def = cardDef(e.card);
        const how = e.superEvolved ? 'super' : 'evolve';
        log(`${name(def)}${e.superEvolved ? '超进化' : '进化'}。`);
        uses.push({ at, turn: turn.turn, side: game.state.cards[e.card]?.controller ?? eventDecision?.player, how, def });
      } else if (turn && e.type === 'attackDeclared') {
        log(`${label[e.player]}用${card(e.attacker)}攻击${card(e.target)}。`);
        attacks.push({ turn: turn.turn, at, side: e.player, attacker: cardDef(e.attacker), target: cardDef(e.target),
          leader: leaders.includes(e.target) });
      } else if (e.type === 'cardsFused') {
        log(`${label[e.player]}融合${e.fusedDefs.map(name).join('、')}。`);
      } else if (e.type === 'cardsSelected' && e.cards.length) {
        log(`${card(e.source)}选择${e.cards.map(card).join('、')}。`);
      } else if (turn && e.type === 'damageDealt' && leaders.includes(e.target)) {
        const side = leaders.indexOf(e.target), source = e.by?.def ?? cardDef(e.source);
        const dealer = e.by?.controller ?? game.state.cards[e.source]?.controller;
        log(`${name(source)}对${label[side]}主战者造成 ${e.amount} 点${e.kind === 'ability' ? '能力' : '攻击'}伤害。`);
        if (dealer !== undefined && dealer !== side) turn.damage[dealer] += e.amount;
        turn.damageDetail.push({ at, side, dealer: dealer ?? null, source, kind: e.kind, amount: e.amount });
      } else if (e.type === 'leaderDefenseChanged') {
        blood[e.player] = e.defense;
        if (turn) {
          turn.after = [...blood];
          if (e.delta > 0) turn.heals[e.player] += e.delta;
          if (e.delta !== 0) log(`${label[e.player]}体力${e.delta > 0 ? '+' : ''}${e.delta}，现为 ${e.defense}。`);
        }
      } else if (e.type === 'playPointsChanged') {
        log(`${label[e.player]} PP 为 ${e.playPoints}/${e.maxPlayPoints}。`);
      } else if (e.type === 'mulligan') redraws[e.player] = e.redraw;
    }
  }

  function snapshot(view, action, alternatives) {
    const [ours, foe] = view.players;
    const field = side => side.field.filter(c => !c.hidden)
      .map(c => ({ def: c.def, attack: c.attack, defense: c.defense, damage: c.damage, engaged: c.engaged,
        ward: c.keywords.includes('ward'), evolved: !!c.evolvedWith }));
    return { at, action, alternatives, hp: [ours.leaderDefense, foe.leaderDefense], pp: [ours.playPoints, foe.playPoints],
      maxPP: [ours.maxPlayPoints, foe.maxPlayPoints], grave: [ours.cemetery.length, foe.cemetery.length],
      ep: [ours.evolutionPoints, ours.superEvolutionPoints], hand: ours.hand.map(c => c.def),
      field: field(ours), enemyField: field(foe), ex: ours.ex.map(c => c.def), enemyEx: foe.ex.map(c => c.def) };
  }

  let eventDecision = null;
  record(game.startupEvents);
  for (const { input, by } of replay.inputs) {
    at++;
    eventDecision = game.decision;
    assert(eventDecision);
    if (eventDecision.type === 'mulligan' && eventDecision.player === 0) {
      openings.push(game.view(0).players[0].hand.map(c => c.def));
    }
    const before = game.state.players[0].zones.cemetery.length;
    if (turn && eventDecision.player === 0 && input.action && eventDecision.actions.length > 1) {
      const actual = describe(input.action);
      const alternatives = [...new Set(eventDecision.actions.map(describe))].filter(a => a !== actual).slice(0, 4);
      if (alternatives.length) turn.choices.push(snapshot(game.view(0), actual, alternatives));
    }
    if (input.action?.type === 'activate') {
      log(`${label[eventDecision.player]}${describe(input.action)}。`);
      if (turn) uses.push({ at, turn: turn.turn, side: eventDecision.player, how: 'activate', def: cardDef(input.action.card) });
    }
    if (input.type === 'choose' && input.ids.length) {
      const picked = input.ids.map(id => eventDecision.options.find(opt => opt.id === id)?.label ?? id);
      log(`${label[eventDecision.player]}为${card(eventDecision.source)}选择 ${picked.join('、')}。`);
    }
    record(game.act(input, by ?? undefined));
    const after = game.state.players[0].zones.cemetery.length;
    if (turn && (before >= 10) !== (after >= 10)) shifts.push({ at, turn: turn.turn, before, after });
  }

  assert.deepEqual(game.result, replay.info.result);
  assert.equal(game.state.turn, replay.info.turn);
  assert.equal(game.state.firstPlayer === 0, number % 2 === 1);
  assert.deepEqual(blood, replay.training.terminalHP);
  assert.equal(openings.length, 1);
  const best = side => turns.reduce((top, row) => row.damage[side] > (top?.damage[side] ?? 0) ? row : top, null);
  const spikes = [0, 1].map(side => {
    const top = best(side);
    return top ? { at: top.at, turn: top.turn, damage: top.damage[side], hp: top.before, detail: top.damageDetail } : null;
  });
  const focal = [best(0), ...turns.toReversed()].find(t => t?.choices.length);
  const primary = focal?.choices.find(c => !c.action.startsWith('结束') && !c.action.startsWith('让过')) ?? focal?.choices[0];
  const review = primary ? { turn: focal.turn, ...primary } : null;
  const summary = { number, winner: game.result.winner, losses: game.result.losses, first: game.state.firstPlayer === 0,
    turn: game.state.turn, hp: blood, inputs: replay.inputs.length, opening: openings[0], redraws, spikes, shifts,
    flags: uses.filter(u => u.side === 1 && u.def === flags && u.how === 'play').length,
    threats: removals.filter(r => r.side === 1 && mainThreats.has(r.def)),
    focus: review, uses, attacks, search: replay.training.search };
  const md = [`# ${p.title}对财宝皇第 ${number} 局 · ${resultLabel(summary.winner)}`, '',
    `${summary.first ? '先攻' : '后攻'}，T${summary.turn} 结束，体力 ${hp(blood)}。体力与 PP 按我方／财宝皇列出，T 为双方合计回合。`, '',
    `[原生录像](../replays/${key}.json) · [我方原表](../deck.json) · [财宝皇原表](../../../16-bp20-loot-300/decks/t7B32v.json)`, '',
    '## 起手和关键回合', '',
    `- 我方起手为${openings[0].map(name).join('、')}，${redraws[0] ? '整手重抽' : '保留'}。${replay.training.opening}。`,
    `- 困难财宝皇${redraws[1] ? '整手重抽' : '保留'}。终局判负条件为${game.result.losses.map(l => label[l.player] + (l.reason === 'deckOut' ? '抽空牌库' : l.reason === 'leaderDefense' ? '体力耗尽' : ' ' + l.reason)).join('、')}。`,
    `- 最高单回合伤害为我方 ${spikes[0]?.damage ?? 0} 点${spikes[0] ? `（T${spikes[0].turn}）` : ''}、财宝皇 ${spikes[1]?.damage ?? 0} 点${spikes[1] ? `（T${spikes[1].turn}）` : ''}。财宝皇共使用 ${summary.flags} 面旗。`];
  if (review) md.push(`- T${review.turn} 输入 ${review.at} 前，体力 ${hp(review.hp)}、PP ${hp(review.pp)}、墓场 ${hp(review.grave)}。实际选择「${review.action}」。当时也可以「${review.alternatives.join('」「')}」。`);
  if (shifts.length) md.push(`- 我方墓场跨过十张门槛的时点为 ${shifts.map(s => `T${s.turn} 输入 ${s.at} ${s.before}→${s.after}`).join('、')}。`);
  md.push('', '## 逐回合', '');
  for (const t of turns) md.push(`### T${t.turn} ${label[t.side]}　${hp(t.before)} → ${hp(t.after)}`, '',
    ...(t.log.length ? t.log : ['- 无需记录的场面变化。']), '');
  return { summary, markdown: md.join('\n') };
}

export function makeBlock(slug, from) {
  assert(starts.includes(from));
  const p = profile(slug);
  const base = join(archive, slug);
  const rows = [];
  for (let n = from; n < from + 10; n++) {
    const { summary, markdown } = inspect(slug, n);
    rows.push(summary);
    save(join(base, 'games', pad(n) + '.md'), markdown);
  }
  const wins = rows.filter(r => r.winner === 0), losses = rows.filter(r => r.winner === 1);
  const won = side => wins.filter(r => r.first === side).length;
  const first = rows.filter(r => r.first).length;
  const md = [`# ${p.title}对困难财宝皇 · 第 ${from}–${from + 9} 局`, '',
    `${wins.length} 胜 ${losses.length} 负 ${10 - wins.length - losses.length} 和。先攻 ${won(true)}/${first}，后攻 ${won(false)}/${10 - first}。双方原表和录像均已核对。`, '',
    '| 局 | 攻顺 | 结果 | 结束 | 终局体力 | 双方最高单回合伤害 | 记录 |',
    '|---:|---|---|---:|---:|---:|---|',
    ...rows.map(r => `| ${r.number} | ${r.first ? '先' : '后'} | ${resultLabel(r.winner)} | T${r.turn} | ${hp(r.hp)} | ${hp(r.spikes.map(s => s?.damage ?? 0))} | [日志](../games/${pad(r.number)}.md) · [录像](../replays/${pad(r.number)}.json) |`), '',
    '## 回看', ''];
  const best = wins.toSorted((a, b) => (b.spikes[0]?.damage ?? 0) - (a.spikes[0]?.damage ?? 0))[0];
  const close = losses.toSorted((a, b) => a.hp[1] - b.hp[1])[0];
  for (const r of [best, close].filter(Boolean)) {
    const c = r.focus;
    md.push(`- [第 ${r.number} 局](../games/${pad(r.number)}.md)${resultLabel(r.winner)}，财宝皇终局 ${r.hp[1]} 血、整局打出 ${r.flags} 面旗。${c ? `接手 T${c.turn} 前 ${c.at} 次输入，双方 PP ${hp(c.pp)}，财宝皇 EX ${c.enemyEx.map(name).join('、') || '为空'}。可比较「${c.action}」和「${c.alternatives[0]}」。` : ''}`);
  }
  const removed = rows.filter(r => r.threats.length).length;
  const lowered = rows.filter(r => r.shifts.some(s => s.before >= 10 && s.after < 10)).length;
  md.push(`- 这批有 ${removed} 局移走过炮手、芭芭萝丝或任一篡夺引擎，${lowered} 局我方墓场从十张以上跌回十张以下。继续比较解引擎时放掉的场攻和皇室下一回合的实际旗数。`, '');
  save(join(base, 'checks', pad(from) + '.md'), md.join('\n'));
  save(join(base, 'checks', pad(from) + '.json'), JSON.stringify(rows) + '\n');
  return wins.length;
}

export function rowsFor(slug) {
  return starts.flatMap(n => {
    const path = join(archive, slug, 'checks', pad(n) + '.json');
    return existsSync(path) ? read(path) : [];
  });
}

export function makeIndex() {
  const protocol = read(protocolPath);
  const md = ['# BP20 十主轴对困难财宝皇', '',
    '双方使用锁定原表。每套 20 先攻、20 后攻，奇数局先攻。逐局从录像重放并核对终局后计入表内。', '',
    '| 主轴 | 网站卡组码 | 已归档 | 先攻胜场 | 后攻胜场 | 总胜负和 | 牌表、录像与复盘 |',
    '|---|---|---:|---:|---:|---|---|'];
  for (const [slug, p] of Object.entries(protocol.decks)) {
    const results = rowsFor(slug);
    const wins = side => results.filter(r => r.first === side && r.winner === 0).length;
    const amount = side => results.filter(r => r.first === side).length;
    const w = wins(true) + wins(false), l = results.filter(r => r.winner === 1).length;
    const links = [`[原表](${slug}/deck.json)`, ...starts.filter(n => existsSync(join(archive, slug, 'checks', pad(n) + '.md')))
      .map(n => `[${n}–${n + 9}](${slug}/checks/${pad(n)}.md)`)];
    const skill = join(archive, '..', '..', 'skills', `sve-bp20-${slug}-vs-loot`, 'SKILL.md');
    if (existsSync(skill)) links.push(`[打法](../../skills/sve-bp20-${slug}-vs-loot/SKILL.md)`);
    md.push(`| ${p.title} | \`${p.key}\` | ${results.length}/40 | ${wins(true)}/${amount(true) || '—'} | ${wins(false)}/${amount(false) || '—'} | ${w}–${l}–${results.length - w - l} | ${links.join(' · ')} |`);
  }
  const reviewLink = existsSync(join(archive, 'review.md')) ? ' · [收官战绩与十份打法](review.md)' : '';
  md.push('', '[对战与牌表锁定说明](README.md) · [协议、原表校验值与强度](protocol.json)' + reviewLink, '');
  save(join(archive, 'index.md'), md.join('\n'));
}
