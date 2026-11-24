// Rebuild native replays after the games and produce Chinese logs and a checkpoint.
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archive, engine, fileHash, fingerprint, loadDecks, locate, pad, protocol, read, save, start } from './game.mjs';

export const titles = { dragon: '侮蔑龙', rune: '破坏法', mirror: '财宝皇' };
const FLAG = 'BP19-T01', GUNNER = 'BP19-026', BARBAROS = 'BP19-019', ORIGINAL = 'BP05-018';
const modes = { recover: '回 2 PP', destroy: '破坏随从', mill: '埋对方两张', crest: '放置纹章', search: '检索' };
const name = def => engine.db.has(def) ? engine.db.get(def).names.cn || engine.db.get(def).name : def || '能力';
const hp = pair => pair.join('／');
const resultLabel = w => w === 0 ? '胜' : w === 1 ? '负' : '和';

export function inspectReplay(file, matchup, number, mode = '') {
  const r = read(file), t = r.training;
  const series = locate(matchup, mode, t.pilot);
  const lock = protocol.opponents[matchup];
  assert.equal(t.matchup, matchup);
  assert.equal(t.number, number);
  assert.equal(t.trial || '', series.trial);
  assert.equal(t.experiment || '', series.experiment);
  assert.equal(t.key, lock.key);
  assert.equal(t.opponentHash, lock.sha256);
  assert.equal(t.ownHash, protocol.ourDeck.sha256);
  assert.equal(t.engine, fingerprint);
  assert.equal(t.opponentEffort, protocol.opponentEffort);
  assert.equal(t.opponentPreset, protocol.opponentPreset);
  assert.equal(t.pilotSha256, fileHash(join(archive, 'pilots', `r${t.pilot}.mjs`)));
  assert.deepEqual(r.options.decks, loadDecks(matchup).decks);
  assert.equal(r.options.seed, `${series.prefix}/${lock.key}/${pad(number)}`);
  assert.equal(r.options.turnOrder, number % 2 ? 'player1' : 'player2');
  assert.equal(r.options.restrictionList, protocol.restrictionList);
  assert.deepEqual(r.options.controllers, ['human', 'hard']);
  assert.equal(r.options.manualActions, false);

  const game = start(r.options);
  const labels = ['我方财宝皇', `困难 ${titles[matchup]}`];
  const defs = new Map();
  const cardDef = id => game.state.cards[id]?.def ?? defs.get(id);
  const leaders = game.state.players.map(p => p.zones.leader[0]);
  const card = id => leaders.includes(id) ? `${labels[leaders.indexOf(id)]}主战者` : name(cardDef(id));
  const blood = [20, 20], turns = [], openings = [], mulligans = [];
  const authored = new Map(t.authored.map(entry => [entry.at, entry.reason]));
  const barb = [], flags = [], steals = [], threshold = [], removal = [];
  const spentEP = [0, 0];
  let round = null;
  let index = -1;
  const log = str => { if (round) round.events.push(`- 输入 ${index}，${str}`); };

  const record = events => {
    for (const e of events) {
      if (e.type === 'turnStarted') {
        round = { turn: e.turn, seat: e.player, before: [...blood], after: [...blood], startAt: index + 1, damage: [0, 0], loss: [0, 0], heals: [0, 0], events: [], choices: [] };
        turns.push(round);
      } else if (e.type === 'cardsMoved') {
        for (const m of e.moves) {
          if (m.card) defs.set(m.card, m.def);
          if (m.newCard) defs.set(m.newCard, m.def);
          if (m.to.zone === 'ex') {
            log(`${labels[m.to.player]}将${name(m.def)}放入 EX。`);
            if (m.from?.zone === 'cemetery' && m.from.player !== m.to.player) steals.push({ turn: round.turn, at: index, seat: m.to.player, def: m.def });
          } else if (m.to.zone === 'hand' && m.to.player === 0 && round) {
            log(`我方将${name(m.def)}加入手牌。`);
          } else if (m.to.zone === 'field' && ['deck', 'resolution', 'cemetery'].includes(m.from?.zone) && m.from.zone !== 'resolution') {
            log(`${labels[m.to.player]}将${name(m.def)}从${m.from.zone === 'deck' ? '牌库' : '墓场'}放到场上。`);
          } else if (m.from?.zone === 'field' && ['cemetery', 'banished', 'hand'].includes(m.to.zone)) {
            log(`${name(m.def)}${{ cemetery: '进入墓场', banished: '被消灭', hand: '回到手牌' }[m.to.zone]}。`);
            if (round && m.to.zone !== 'hand') removal.push({ turn: round.turn, at: index, seat: m.from.player, def: m.def });
          }
        }
      } else if (e.type === 'cardPlayed') {
        log(`${labels[e.player]}从${e.from === 'ex' ? 'EX' : e.from === 'hand' ? '手牌' : e.from}使用${name(e.def)}。`);
        if (e.def === FLAG) flags.push({ turn: round.turn, at: index, seat: e.player });
      } else if (e.type === 'cardsFused') {
        log(`${labels[e.player]}融合${e.fusedDefs.map(name).join('、')}。`);
      } else if (e.type === 'evolved') {
        log(`${card(e.card)}${e.superEvolved ? '超进化' : '进化'}。`);
        if (cardDef(e.card) === BARBAROS) barb.push({ turn: round.turn, at: index, seat: game.state.cards[e.card].controller });
      } else if (e.type === 'attackDeclared') {
        log(`${labels[e.player]}用${card(e.attacker)}攻击${card(e.target)}。`);
      } else if (e.type === 'cardsSelected' && e.cards.length) {
        log(`${card(e.source)}选择${e.cards.map(card).join('、')}。`);
      } else if (e.type === 'damageDealt' && leaders.includes(e.target)) {
        const harmed = leaders.indexOf(e.target);
        const source = e.by?.def || cardDef(e.source);
        log(`${name(source)}对${labels[harmed]}主战者造成 ${e.amount} 点${e.kind === 'ability' ? '能力' : '攻击'}伤害。`);
        if (round) {
          const dealer = e.by?.controller ?? game.state.cards[e.source]?.controller;
          if (dealer !== undefined && dealer !== harmed) round.damage[dealer] += e.amount;
          round.loss[harmed] += e.amount;
        }
      } else if (e.type === 'leaderDefenseChanged') {
        blood[e.player] = e.defense;
        if (round) {
          round.after = [...blood];
          if (e.delta > 0) round.heals[e.player] += e.delta;
        }
        if (e.delta !== 0) log(`${labels[e.player]}体力${e.delta > 0 ? '+' : ''}${e.delta}，现为 ${e.defense}。`);
      } else if (e.type === 'mulligan') mulligans[e.player] = e.redraw;
      else if (e.type === 'gameEnded') {
        for (const loss of e.result.losses) if (loss.reason === 'deckOut') log(`${labels[loss.player]}因需要抽牌时牌库已空而落败。`);
      }
    }
  };

  function describe(action, view) {
    const me = view.players[view.viewer];
    const foe = view.players[1 - view.viewer];
    if (action.type === 'play') return `使用${card(action.card)}`;
    if (action.type === 'attack') return `用${card(action.attacker)}攻击${card(action.target)}`;
    if (action.type === 'evolve') return `${action.superEvolve ? '超进化' : '进化'}${card(action.card)}${action.useEvolutionPoint ? '（用 EP）' : ''}`;
    if (action.type === 'activate') return `起动${card(action.card)}的能力 ${action.ability}`;
    if (action.type === 'pass') return `在对方剩 ${foe.playPoints} PP 时让过 Quick`;
    if (action.type === 'endMainPhase') return `保留 ${me.playPoints} PP 结束主阶段`;
    return action.type;
  }

  record(game.startupEvents);
  for (const { input, by } of r.inputs) {
    index++;
    const d = game.decision;
    assert(d);
    const view = d.player === 0 ? game.view(0) : null;
    if (d.type === 'mulligan') openings[d.player] = game.view(d.player).players[d.player].hand.map(c => c.def);
    const before = game.state.players.map(p => p.zones.cemetery.length);
    if (view && round && input.action && d.actions.length > 1) {
      const action = describe(input.action, view);
      const alternatives = [...new Set(d.actions.map(a => describe(a, view)))].filter(a => a !== action).slice(0, 3);
      const [me, foe] = view.players;
      if (alternatives.length) round.choices.push({ at: index, action, alternatives, before: [me.leaderDefense, foe.leaderDefense],
        pp: [me.playPoints, foe.playPoints], ex: me.ex.map(c => c.def), enemyGrave: foe.cemetery.length,
        field: me.field.filter(c => !c.hidden).map(c => [c.def, c.attack, c.defense, c.engaged]),
        enemyField: foe.field.filter(c => !c.hidden).map(c => [c.def, c.attack, c.defense, c.engaged]),
      });
    }
    if (input.action?.type === 'activate') log(`${labels[d.player]}起动${card(input.action.card)}的能力 ${input.action.ability}。`);
    if (input.action?.type === 'evolve' && input.action.useEvolutionPoint) spentEP[d.player]++;
    if (input.type === 'choose' && input.ids.length) {
      const descriptions = input.ids.map(id => modes[id] ?? d.options.find(o => o.id === id)?.label ?? id);
      log(`${labels[d.player]}为${card(d.source)}选择${descriptions.join('、')}。`);
    }
    if (authored.has(index) && round) log(`打法指定选择。${authored.get(index)}。`);
    record(game.act(input, by ?? undefined));
    for (let seat = 0; seat <= 1; seat++) {
      const after = game.state.players[seat].zones.cemetery.length;
      if (round && (before[seat] >= 10) !== (after >= 10)) threshold.push({ at: index, turn: round.turn, graveSeat: seat, before: before[seat], after });
    }
  }
  assert.deepEqual(game.result, r.info.result);
  assert.equal(game.state.turn, r.info.turn);
  assert.deepEqual(blood, t.terminalHP);
  const largest = seat => turns.reduce((best, row) => row.damage[seat] >= (best?.damage[seat] ?? 0) && row.damage[seat] ? row : best, null);
  const ownSpike = largest(0), enemySpike = largest(1);
  const focus = (ownSpike && ownSpike.choices.length ? ownSpike : [...turns].reverse().find(row => row.choices.length));
  const choice = focus?.choices.find(c => /进化出航的罪人·芭芭萝丝/.test(c.action))
    ?? focus?.choices.find(c => !c.action.includes('结束主阶段')) ?? focus?.choices[0];
  const summary = { number, pilot: t.pilot, winner: game.result.winner, losses: game.result.losses, first: game.state.firstPlayer === 0,
    turn: game.state.turn, inputs: r.inputs.length, hp: blood, mulligans, openings,
    spikes: [ownSpike, enemySpike].map((row, seat) => row ? { turn: row.turn, damage: row.damage[seat], heals: row.heals, at: row.startAt, hp: row.before } : null),
    barb, flags, steals, threshold, removal, spentEP, choice: choice ? { turn: focus.turn, ...choice } : null,
    search: t.search };

  const firstLine = (summary.first ? '先攻' : '后攻') + `，T${summary.turn} ${resultLabel(summary.winner)}，终局体力 ${hp(blood)}。`;
  const md = [`# ${titles[matchup]}第 ${number} 局 · ${resultLabel(summary.winner)}`, '',
    `${firstLine} 体力与 PP 顺序均为我方／对手。财宝皇原表，打法 r${t.pilot}。`,
    '', '[原生录像](../replays/' + pad(number) + '.json) · [我方牌表](' + (series.experiment ? '../../../16-bp20-loot-300' : '../..') + '/decks/t7B32v.json) · [固定对手牌表](../../../' + lock.archive + '/opponent.json)',
    '', '## 起手与赛后回看', '',
    `- 我方起手 ${openings[0].map(name).join('、')}。${mulligans[0] ? '整手重抽' : '保留'}${authored.size ? `，${[...authored.values()][0]}` : ''}。`,
    `- 对手${mulligans[1] ? '整手重抽' : '保留起手'}。终局由${game.result.losses.map(l => `${labels[l.player]}${l.reason === 'deckOut' ? '抽空牌库' : '体力归零'}`).join('与')}决定。`,
    ownSpike ? `- 我方最高单回合伤害为 T${ownSpike.turn} 的 ${ownSpike.damage[0]} 点。` : '- 我方全局未对敌方主战者造成伤害。',
    enemySpike ? `- 对手最高单回合伤害为 T${enemySpike.turn} 的 ${enemySpike.damage[1]} 点。` : '- 对手全局未对我方主战者造成伤害。',
  ];
  if (choice) {
    md.push(`- T${focus.turn} 输入 ${choice.at} 前，双方体力 ${hp(choice.before)}，PP ${hp(choice.pp)}，对手墓场 ${choice.enemyGrave} 张，我方 EX ${choice.ex.map(name).join('、') || '为空'}。实际选择「${choice.action}」。同一步可比较「${choice.alternatives.join('」「')}」。`);
  }
  if (threshold.length) md.push(`- 墓场十张开关记录。${threshold.map(x => `T${x.turn} 输入 ${x.at} ${labels[x.graveSeat]} ${x.before} → ${x.after}`).join('，')}。`);
  if (steals.length) md.push(`- 进 EX 的对方墓牌。${steals.map(x => `T${x.turn} 输入 ${x.at} ${labels[x.seat]}取${name(x.def)}`).join('，')}。`);
  md.push('', '## 逐回合日志');
  for (const row of turns) {
    md.push('', `### T${row.turn} ${labels[row.seat]}　${hp(row.before)} → ${hp(row.after)}`, '',
      ...(row.events.length ? row.events : ['- 结束回合，未发生出牌、攻击或伤害。']));
  }
  return { summary, markdown: md.join('\n') + '\n' };
}

function summarizeBlock(matchup, startAt, count, mode, revision) {
  assert(Object.hasOwn(titles, matchup));
  const root = locate(matchup, mode, revision).folder;
  const rows = [];
  for (let number = startAt; number < startAt + count; number++) {
    const { summary, markdown } = inspectReplay(join(root, 'replays', `${pad(number)}.json`), matchup, number, mode);
    rows.push(summary);
    save(join(root, 'games', `${pad(number)}.md`), markdown);
  }
  const w = rows.filter(r => r.winner === 0).length, l = rows.filter(r => r.winner === 1).length;
  const group = pad(startAt);
  const md = [`# 财宝皇对${titles[matchup]} · ${startAt}–${startAt + count - 1} 局`, '',
    `${w} 胜 ${l} 负 ${count - w - l} 和。双方使用锁定牌表。每份录像已按相同的引擎和输入重放到同一终局。`, '',
    '| 局 | 先后攻 | 结果 | 终局 | 我方／对手末血 | 我方／对手最高单回合伤害 | 日志与录像 |',
    '|---|---|---|---|---|---|---|',
    ...rows.map(r => `| ${r.number} | ${r.first ? '先' : '后'} | ${resultLabel(r.winner)} | T${r.turn} | ${hp(r.hp)} | ${hp(r.spikes.map(s => s?.damage ?? 0))} | [日志](../games/${pad(r.number)}.md) · [录像](../replays/${pad(r.number)}.json) |`),
    '', '## 回看两局', '',
  ];
  const top = rows.filter(r => r.winner === 0).sort((a, b) => (b.spikes[0]?.damage || 0) - (a.spikes[0]?.damage || 0))[0];
  const loss = rows.filter(r => r.winner === 1).sort((a, b) => a.hp[1] - b.hp[1])[0];
  for (const r of [top, loss].filter(Boolean)) {
    const start = r.spikes[0], reply = r.spikes[1], c = r.choice;
    if (!start || !c) continue;
    md.push(`- [第 ${r.number} 局](../games/${pad(r.number)}.md) 我方 T${start.turn} 打出 ${start.damage}，${reply ? `对方最大是 T${reply.turn} 的 ${reply.damage}，` : ''}终局 ${hp(r.hp)}。接手 T${c.turn} 输入 ${c.at}。双方 PP ${hp(c.pp)}、敌墓 ${c.enemyGrave}。比较实际的「${c.action}」与「${c.alternatives[0]}」，把场攻、可打的旗和清场后的伤害分别核算。`);
  }
  save(join(root, 'checks', `${group}.md`), md.join('\n') + '\n');
  save(join(root, 'checks', `${group}.json`), JSON.stringify(rows, null, 2) + '\n');
  console.log(`${matchup} ${startAt}–${startAt + count - 1}: ${w}W ${l}L ${count - w - l}D`);
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === resolve(process.argv[1]).toLowerCase()) {
  const [matchup, from, count, mode = '', revision = '1'] = process.argv.slice(2);
  for (const key of matchup.split(',')) summarizeBlock(key, Number(from), Number(count), mode, revision);
}
