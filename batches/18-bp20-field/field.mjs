import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deckHash, engine, fileHash, fingerprint, pad, read, rt, save, start } from '../16-bp20-loot-300/game.mjs';
import { makePilot, profiles } from './pilot.mjs';

export { deckHash, engine, pad, read, save, start };
export const archive = dirname(fileURLToPath(import.meta.url));
export const protocolPath = join(archive, 'protocol.json');
const pilotPath = join(archive, 'pilot.mjs');
const previous = join(archive, '..', '16-bp20-loot-300');
export const rivalPath = join(previous, 'decks', 't7B32v.json');
const rivalLock = read(join(previous, 'protocol.json'));
export const site = 'https://www.svehelperwin.com/#/deck-list';
export const slugOf = Object.fromEntries(Object.entries(profiles).map(([slug, p]) => [p.key, slug]));
const selected = Object.entries(profiles);
export const profile = slug => {
  assert(Object.hasOwn(profiles, slug), slug);
  return profiles[slug];
};

function counts(counts) {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

function validate(deck) {
  const deckList = rt.toDeckList(deck);
  for (const printing of [deck.leader, ...Object.keys(deck.main), ...Object.keys(deck.evolve)]) {
    assert(!/^BP(2[1-9]|[3-9]\d)-/.test(printing), `在 BP21 或之后的卡 ${printing}`);
    assert.notEqual(engine.implementationStatus(engine.db.ofPrinting(printing).id), 'missing', printing);
  }
  assert.deepEqual(engine.validateDeck(deckList, { deckRestrictions: true }), []);
  return deckList;
}

function writeLock(path, data) {
  if (existsSync(path)) assert.deepEqual(read(path), data, path);
  else save(path, JSON.stringify(data, null, 2) + '\n');
}

function sourceSnapshot(row) {
  const { key, name, belong_category, type, craft, leader_card_no, basic_deck, evo_deck } = row;
  return { key, name, belong_category, type, craft, leader_card_no, basic_deck, evo_deck };
}

function deckFrom(source) {
  return { format: 'sve-deck', version: 1, name: `${source.name} [${source.key}]`,
    leader: source.leader_card_no, main: source.basic_deck, evolve: source.evo_deck };
}

function lockField() {
  const helper = resolve('../../analysis/practice/bp20-field/helper');
  const listing = read(join(helper, 'listing.json'));
  assert.equal(listing.filters.belong_category, 'BP20');
  assert.equal(new Set(selected.map(([, p]) => p.key)).size, 10);
  assert.equal(new Set(selected.map(([, p]) => p.axis)).size, 10);
  const decks = {};
  for (const [slug, p] of selected) {
    const source = sourceSnapshot(read(join(helper, p.key + '.json')));
    const listed = listing.rows.find(d => d.key === p.key);
    assert(listed);
    assert.deepEqual(source, sourceSnapshot(listed));
    assert.equal(source.belong_category, 'BP20');
    assert.equal(source.type, 'Basic');
    const mine = deckFrom(source);
    validate(mine);
    for (const id of [...p.early, ...p.anchor]) assert(Object.hasOwn(mine.main, id), `${slug}: ${id}`);
    writeLock(join(archive, slug, 'source.json'), source);
    writeLock(join(archive, slug, 'deck.json'), mine);
    decks[slug] = { key: p.key, downloadedName: source.name, title: p.title, axis: p.axis,
      craft: source.craft, main: counts(mine.main), evolve: counts(mine.evolve), sha256: deckHash(mine) };
    console.log(`${p.title} ${p.key} ${counts(mine.main)}/${counts(mine.evolve)}`);
  }
  const opponent = read(rivalPath);
  assert.equal(deckHash(opponent), rivalLock.ourDeck.sha256);
  assert.equal(opponent.main['BP05-018'], 3);
  validate(opponent);
  writeLock(protocolPath, { series: 'sve-exp/bp20-field/2026-11-24/v1', simulatorCommit: rivalLock.simulatorCommit,
    engine: fingerprint, source: { url: site, filters: listing.filters, total: listing.rows.length },
    deckRestrictions: true, restrictionList: null, opponent: { ...rivalLock.ourDeck, preset: 'hard-next', effort: 1 },
    pilotSha256: fileHash(pilotPath), first: 20, second: 20, decks });
}

const cached = new Map();
export function setup(slug, number) {
  assert(Number.isInteger(number) && number >= 1 && number <= 40);
  if (!cached.has(slug)) {
    const protocol = read(protocolPath);
    const p = profile(slug);
    const row = protocol.decks[slug];
    assert.equal(p.key, row.key);
    assert.equal(protocol.engine, fingerprint);
    assert.equal(protocol.pilotSha256, fileHash(pilotPath));
    const mine = read(join(archive, slug, 'deck.json')), rival = read(rivalPath);
    assert.deepEqual(mine, deckFrom(read(join(archive, slug, 'source.json'))));
    assert.equal(deckHash(mine), row.sha256);
    assert.equal(deckHash(rival), protocol.opponent.sha256);
    const decks = [mine, rival].map(validate);
    cached.set(slug, { p, protocol, row, mine, rival, decks });
  }
  const { p, protocol, row, mine, rival, decks } = cached.get(slug);
  const seed = `${protocol.series}/${p.key}/${pad(number)}`;
  const options = { seed, decks, deckNames: [mine.name, rival.name], controllers: ['human', 'hard'], format: 'standard',
    restrictionList: protocol.restrictionList, deckRestrictions: protocol.deckRestrictions,
    manualActions: false, showEveryMainPhase: true, askEveryQuickWindow: true, turnOrder: number % 2 ? 'player1' : 'player2' };
  const metadata = { slug, key: p.key, number, ownHash: row.sha256, opponentHash: protocol.opponent.sha256,
    engine: fingerprint, pilotSha256: protocol.pilotSha256,
    opponentPreset: protocol.opponent.preset, opponentEffort: protocol.opponent.effort };
  return { options, metadata, p, protocol };
}

export function verifyHeader(replay, slug, number) {
  const { options, metadata } = setup(slug, number);
  assert.equal(replay.format, 'sve-replay');
  assert.equal(replay.version, 1);
  assert.deepEqual(replay.options, options);
  for (const [k, v] of Object.entries(metadata)) assert.equal(replay.training[k], v, k);
  assert(replay.info.result);
}

function play(slug, number) {
  const file = join(archive, slug, 'replays', pad(number) + '.json');
  if (existsSync(file)) {
    verifyHeader(read(file), slug, number);
    return;
  }
  const began = performance.now();
  const { options, metadata, p, protocol } = setup(slug, number);
  const game = start(options);
  const pilot = makePilot({ engine, rt, p, seed: options.seed + ':own' });
  const hard = rt.createPresetBot(engine, protocol.opponent.preset, options.seed + ':hard:1', protocol.opponent.effort);
  const inputs = [];
  let opening = '';
  while (game.decision) {
    assert(inputs.length < 5000, 'Game did not finish after 5000 inputs');
    const d = game.decision;
    const forced = d.type === 'quick' && d.actions.every(a => a.type === 'pass');
    const by = forced ? null : d.player;
    const input = forced ? { type: 'quick', action: { type: 'pass' } } : by === 0 ? pilot.decide(game) : hard.decide(game);
    if (by === 0 && d.type === 'mulligan') opening = pilot.reason;
    game.act(input, by ?? undefined);
    inputs.push({ input, by });
  }
  const verify = start(options);
  for (const { input, by } of inputs) verify.act(input, by ?? undefined);
  assert(game.result);
  assert.deepEqual(verify.state, game.state);
  assert.equal(game.state.firstPlayer, (number + 1) % 2);
  const search = [pilot.stats, hard.stats].map(({ simulations, fallbacks, simulationFailures }) =>
    ({ simulations, fallbacks, simulationFailures }));
  const training = { ...metadata, opening, search, terminalHP: game.state.players.map(s => s.leaderDefense) };
  const replay = { format: 'sve-replay', version: 1, options, inputs, info: { result: game.result, turn: game.state.turn }, training };
  verifyHeader(replay, slug, number);
  save(file, JSON.stringify(replay) + '\n');
  console.log(`${slug} ${pad(number)} W${game.result.winner} T${game.state.turn} ${training.terminalHP.join('/')} ${((performance.now() - began) / 1000).toFixed(1)}s`);
}

if (process.argv[1] && basename(process.argv[1]) === 'field.mjs') {
  const [slug, number] = process.argv.slice(2);
  if (slug === '--lock') lockField();
  else play(slug, Number(number));
  process.exit(0);
}
