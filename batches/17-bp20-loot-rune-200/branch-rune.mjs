// Rewind a finished game using its original pilots and change one play at T4.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { archive, engine, extraArchive, read, rt, save, start } from '../16-bp20-loot-300/game.mjs';
import { makePilot } from '../16-bp20-loot-300/pilots/r2.mjs';

const origin = read(join(archive, 'rune', 'replays', '042.json'));
const from = 14;
const g = start(origin.options);
const me = makePilot({ engine, rt, seat: 0, matchup: 'rune', seed: 'loot-pilot/v2/rune/042/formal' });
const hard = rt.createPresetBot(engine, 'hard-next', `${origin.options.seed}:hard:1`, 1);
const inputs = [];

function give() {
  const d = g.decision;
  const forcedPass = d.type === 'quick' && d.actions.every(a => a.type === 'pass');
  return { by: forcedPass ? null : d.player, input: forcedPass ? { type: 'quick', action: { type: 'pass' } } : d.player === 0 ? me.decide(g) : hard.decide(g) };
}

const hits = [];
function act(step) {
  const turn = g.state.turn;
  const events = g.act(step.input, step.by ?? undefined);
  inputs.push(step);
  for (const e of events) {
    if (e.type === 'damageDealt' && e.by?.def === 'BP08-050' && e.kind === 'ability' && e.target === g.state.players[0].zones.leader[0]) hits.push({ turn, amount: e.amount });
  }
}

for (const expected of origin.inputs.slice(0, from)) {
  const actual = give();
  assert.deepEqual(actual, expected);
  act(actual);
}
assert.equal(g.view(0).turn, 4);
const decision = g.view(0).decision;
const spell = g.view(0).players[0].hand.find(c => c.def === 'BP20-026');
const play = decision.actions.find(a => a.type === 'play' && a.card === spell?.id);
assert(play);
act({ by: 0, input: { type: 'mainPhase', action: play } });
if (g.decision.type === 'selectCards') {
  const d = g.view(0).decision;
  const target = d.candidates[d.candidateDefs.indexOf('BP05-048')];
  assert(target);
  act({ by: 0, input: { type: 'selectCards', cards: [target] } });
}
assert(!g.view(0).players[1].field.some(c => c.def === 'BP05-048'));

let afterFoe;
while (g.decision) {
  if (!afterFoe && g.state.turn >= 6) {
    const [first, second] = g.view(0).players;
    afterFoe = { hp: [first.leaderDefense, second.leaderDefense], field: [first.field, second.field].map(s => s.map(c => c.def)) };
    console.log('After T5', JSON.stringify({ afterFoe, hits }));
  }
  act(give());
  assert(inputs.length < 5000);
}
assert(g.result);
const verify = start(origin.options);
for (const { input, by } of inputs) verify.act(input, by ?? undefined);
assert.deepEqual(g.state, verify.state);
const terminalHP = g.view(0).players.map(p => p.leaderDefense);
const replay = { format: origin.format, version: origin.version, options: origin.options, inputs, info: { turn: g.state.turn, result: g.result },
  practice: { source: '16-bp20-loot-300/rune/replays/042.json', prefix: from, afterFoe, zealotAbilityHits: hits, terminalHP } };
save(join(extraArchive, 'branches', 'rune-042-cut-idol.json'), JSON.stringify(replay) + '\n');
console.log(JSON.stringify({ winner: g.result.winner, turn: g.state.turn, terminalHP, hits }));
