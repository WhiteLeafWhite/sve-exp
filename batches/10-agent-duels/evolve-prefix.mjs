import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';

// A card's instance ID follows its physical position in the original deck.
// Match copies of each printing first, then identify the one unused spare.
function alignCards(oldGame, newGame) {
  const oldCards = oldGame.state.players[0].zones.evolveDeck;
  const available = new Set(newGame.state.players[0].zones.evolveDeck);
  const ids = new Map(), missing = [];
  for (const id of oldCards) {
    const printing = oldGame.state.cards[id].printing;
    const match = [...available].find(other => newGame.state.cards[other].printing === printing);
    if (match) { ids.set(id, match); available.delete(match); }
    else missing.push(id);
  }
  const extra = [...available];
  assert(missing.length === extra.length && missing.length <= 1, 'Compare at most one spare evolve card');
  if (missing.length) ids.set(missing[0], extra[0]);
  return { ids, missing, extra };
}

function relabel(value, ids) {
  if (typeof value === 'string') return ids.get(value) ?? value;
  if (Array.isArray(value)) return value.map(x => relabel(x, ids));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .map(([k, x]) => [ids.get(k) ?? k, relabel(x, ids)]));
  return value;
}

function position(game, ids, excluded) {
  const value = relabel(game.state, ids);
  // These two fields contain the currently offered actions, which can differ
  // solely because an additional type of evolve is available. Each actual
  // historical answer is validated against both engines below.
  delete value.pending;
  delete value.anchor;
  value.players[0].zones.evolveDeck.sort();
  for (const id of excluded) {
    assert.equal(value.cards[id].zone, 'evolveDeck', 'The substituted card was already used');
    delete value.cards[id];
  }
  // Initial zone sequence is the original physical card number. Subsequent
  // entries into zones receive a new sequence and must agree exactly.
  for (const [oldId, newId] of ids) {
    const card = value.cards[newId];
    if (card && card.zoneSeq === Number(oldId.slice(1))) card.zoneSeq = Number(newId.slice(1));
  }
  return value;
}

export function replayEvolvePrefix(engine, rt, original, alternate, boundary) {
  const opts = original.options;
  assert.deepEqual(alternate.main, opts.decks[0].main, 'Both main decks must have the same physical order');
  assert.equal(alternate.leader, opts.decks[0].leader);
  assert.equal(alternate.evolve.length, opts.decks[0].evolve.length);
  const make = decks => engine.newGame({seed:opts.seed,players:decks,config:rt.configOf(opts)});
  const oldGame = make(opts.decks), newGame = make([alternate, opts.decks[1]]);
  const {ids, missing, extra} = alignCards(oldGame, newGame);
  const identity = new Map(), inputs = [];
  const slots = missing.map((id, i) => ({from:oldGame.state.cards[id].printing,to:newGame.state.cards[extra[i]].printing}));
  for (let i = 0; i <= boundary; i++) {
    const left = position(oldGame, ids, extra), right = position(newGame, identity, extra);
    for (const key of Object.keys(left)) assert(isDeepStrictEqual(left[key], right[key]), `Physical ${key} diverged before input ${i}`);
    assert.equal(oldGame.decision?.type, newGame.decision?.type);
    assert.equal(oldGame.decision?.player, newGame.decision?.player);
    if (i === boundary) break;
    const {input,by} = original.inputs[i], replacement = relabel(input, ids);
    assert.equal(rt.validateAnswer(oldGame.decision, input), null);
    assert.equal(rt.validateAnswer(newGame.decision, replacement), null, `Historical move unavailable at ${i}`);
    oldGame.act(input, by ?? undefined);
    newGame.act(replacement, by ?? undefined);
    inputs.push({input:replacement,by});
  }
  return {game:newGame, inputs, slots, verifiedPositions:boundary + 1};
}
