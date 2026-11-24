// Two turn-ordering exercises. This file only runs after the original games.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { archive, engine, read, rt, save, start } from './game.mjs';
import { makePilot } from './pilots/r1.mjs';

const GUN = 'BP19-026', FLAG = 'BP19-T01', HOLLOW = 'BP15-020';

function exercise(matchup, number, prefix) {
  const origin = read(join(archive, matchup, 'replays', `${number}.json`));
  const g = start(origin.options);
  const inputs = origin.inputs.slice(0, prefix);
  for (const { input, by } of inputs) g.act(input, by ?? undefined);
  const begin = g.view(0);
  const [mine, foe] = begin.players;
  const oldGunner = mine.field.find(c => c.def === GUN).id;
  const hollow = mine.field.find(c => c.def === HOLLOW).id;
  assert.equal(foe.playPoints, 0);
  const actions = [];

  function take(input, by = g.decision.player) {
    g.act(input, by ?? undefined);
    inputs.push({ input, by });
  }

  function main(predicate, pick) {
    const d = g.decision;
    assert(d?.type === 'mainPhase' && d.player === 0);
    const action = d.actions.find(predicate);
    assert(action);
    actions.push(inputs.length);
    take({ type: 'mainPhase', action });
    while (g.decision && g.decision.type !== 'mainPhase') {
      const next = g.decision;
      if (next.type === 'quick') {
        assert(next.actions.every(a => a.type === 'pass'));
        take({ type: 'quick', action: { type: 'pass' } }, null);
      } else {
        assert.equal(next.player, 0);
        if (next.type === 'selectCards' && pick) {
          const target = pick(next);
          assert(next.candidates.includes(target), JSON.stringify(next));
          take({ type: 'selectCards', cards: [target] });
        } else {
          const [answer] = rt.enumerateAnswers(next, 20).answers;
          assert(answer);
          take(answer);
        }
      }
    }
  }

  const play = (def, pick) => {
    const side = g.view(0).players[0];
    const ids = [...side.ex, ...side.hand].filter(c => c.def === def).map(c => c.id);
    main(a => a.type === 'play' && ids.includes(a.card), pick);
  };
  const discount = () => main(a => a.type === 'activate' && a.card === hollow && a.ability === 1);
  const flag = () => play(FLAG, d => d.source === null || d.candidateDefs.includes(GUN) ? oldGunner : foe.leader.id);
  const face = id => main(a => a.type === 'attack' && a.attacker === id && a.target === foe.leader.id);

  play(GUN);
  if (matchup === 'dragon') {
    play('BP05-029');
    discount();
    play('BP20-026', () => foe.field.find(c => c.def === 'BP05-055').id);
  } else play(GUN);
  flag();
  discount();
  flag();
  face(oldGunner);
  if (matchup === 'dragon') face(hollow);
  const endOfLineHP = g.view(0).players.map(p => p.leaderDefense);
  assert.deepEqual(endOfLineHP, matchup === 'dragon' ? [17, 5] : [7, 0]);
  const endOfLine = inputs.length;

  const minePilot = makePilot({ engine, rt, seat: 0, matchup, seed: `loot-branch/${matchup}/ours` });
  const hard = rt.createPresetBot(engine, 'hard-next', `${origin.options.seed}:hard:1`, 1);
  while (g.decision) {
    const d = g.decision;
    const forcedPass = d.type === 'quick' && d.actions.every(a => a.type === 'pass');
    const input = forcedPass ? { type: 'quick', action: { type: 'pass' } } : d.player === 0 ? minePilot.decide(g) : hard.decide(g);
    take(input, forcedPass ? null : d.player);
    assert(inputs.length < 5000);
  }
  const verify = start(origin.options);
  for (const { input, by } of inputs) verify.act(input, by ?? undefined);
  assert(g.result);
  assert.deepEqual(g.state, verify.state);
  const replay = { format: origin.format, version: origin.version, options: origin.options, inputs,
    info: { result: g.result, turn: g.state.turn }, practice: { source: `${matchup}/replays/${number}.json`, prefix, actions,
      endOfLine, endOfLineHP, terminalHP: g.view(0).players.map(p => p.leaderDefense) } };
  save(join(archive, 'branches', `${matchup}-${number}-flags-first.json`), JSON.stringify(replay) + '\n');
  console.log(matchup, number, replay.practice, 'finish', replay.info.turn, replay.info.result.winner);
}

const key = process.argv[2];
if (!key || key === 'dragon') exercise('dragon', '005', 40);
if (!key || key === 'mirror') exercise('mirror', '008', 76);
