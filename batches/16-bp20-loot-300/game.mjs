// From the pinned simulator checkout: node <this file> <matchup> <number> <revision> [trial]
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const archive = dirname(fileURLToPath(import.meta.url));
export const rt = await import(pathToFileURL(resolve('dist/bp20-loot-engine.mjs')).href);
export const engine = rt.createEngine({ cards: rt.ALL_CARDS, scripts: rt.ALL_SCRIPTS });
export const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
export const save = (path, data) => {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, data, 'utf8');
  renameSync(tmp, path);
};
export const fingerprint = rt.engineFingerprint(resolve('packages/gui'));
export const protocol = read(join(archive, 'protocol.json'));
export const deckHash = ({ leader, main, evolve }) => createHash('sha256').update(JSON.stringify([
  leader, Object.entries(main).sort(), Object.entries(evolve).sort(),
])).digest('hex');
export const fileHash = path => createHash('sha256').update(readFileSync(path, 'utf8').replace(/\r\n/g, '\n')).digest('hex');

export function loadDecks(matchup) {
  const lock = protocol.opponents[matchup];
  const rivalRoot = join(archive, '..', lock.archive);
  const rival = rt.parseDeckFile(read(join(rivalRoot, 'opponent.json')));
  const source = read(join(rivalRoot, 'source.json'));
  assert.deepEqual([rival.leader, rival.main, rival.evolve], [source.leader_card_no, source.basic_deck, source.evo_deck]);
  assert.equal(deckHash(rival), lock.sha256);
  const mine = rt.parseDeckFile(read(join(archive, 'decks', `${protocol.ourDeck.key}.json`)));
  assert.equal(deckHash(mine), protocol.ourDeck.sha256);
  assert.equal(mine.main['BP05-018'], 3);
  for (const printing of [mine.leader, ...Object.keys(mine.main), ...Object.keys(mine.evolve)]) {
    assert(/^BP(0[1-9]|1\d|20)-/.test(printing), `Outside BP01–20: ${printing}`);
    const status = engine.implementationStatus(engine.db.ofPrinting(printing).id);
    assert(['scripted', 'vanilla'].includes(status), `${printing}: ${status}`);
  }
  const decks = [mine, rival].map(deck => rt.toDeckList(deck));
  for (const deck of decks) assert.deepEqual(engine.validateDeck(deck, { deckRestrictions: true }), []);
  return { mine, rival, decks };
}

export function start(options) {
  return engine.newGame({ seed: options.seed, players: options.decks, config: rt.configOf(options) });
}

export const pad = n => String(n).padStart(3, '0');

async function play(matchup, number, revision, trial = '') {
  assert(Object.hasOwn(protocol.opponents, matchup));
  assert(Number.isInteger(number) && number >= 1 && number <= protocol.gamesPerOpponent);
  assert(/^\d+$/.test(revision) && /^[a-z0-9-]*$/.test(trial));
  const pilotPath = join(archive, 'pilots', `r${revision}.mjs`);
  const pilotSha256 = fileHash(pilotPath);
  const { makePilot } = await import(pathToFileURL(pilotPath).href);
  const { mine, rival, decks } = loadDecks(matchup);
  const key = protocol.opponents[matchup].key;
  const seed = `${protocol.series}/${trial ? `practice-${trial}` : 'formal'}/${key}/${pad(number)}`;
  const options = { seed, decks, deckNames: [mine.name, rival.name], controllers: ['human', 'hard'], format: 'standard',
    restrictionList: protocol.restrictionList, deckRestrictions: true, manualActions: false, showEveryMainPhase: true, askEveryQuickWindow: true,
    turnOrder: number % 2 === 1 ? 'player1' : 'player2' };
  const directory = trial ? join(resolve('../../analysis/practice/loot-stage'), trial, `r${revision}`, matchup) : join(archive, matchup);
  const file = join(directory, 'replays', `${pad(number)}.json`);
  const metadata = { matchup, key, number, pilot: Number(revision), pilotSha256, engine: fingerprint,
    opponentHash: deckHash(rival), ownHash: deckHash(mine), opponentPreset: protocol.opponentPreset, opponentEffort: protocol.opponentEffort,
    restrictionList: protocol.restrictionList, ...(trial ? { trial } : {}) };
  if (existsSync(file)) {
    const old = read(file);
    assert.deepEqual(old.options, options);
    for (const [k, v] of Object.entries(metadata)) assert.equal(old.training[k], v, k);
    assert(old.info.result);
    console.log(`${matchup} ${pad(number)} already verified W=${old.info.result.winner} T${old.info.turn}`);
    return;
  }

  const g = start(options);
  const minePilot = makePilot({ engine, rt, seat: 0, matchup, seed: `loot-pilot/v${revision}/${matchup}/${pad(number)}/${trial || 'formal'}` });
  const hard = rt.createPresetBot(engine, protocol.opponentPreset, `${seed}:hard:1`, protocol.opponentEffort);
  const inputs = [], authored = [];
  const began = performance.now();
  let nextTrace = began + 45_000;
  while (g.decision) {
    assert(inputs.length < 5000, 'Game did not finish within 5000 inputs');
    const d = g.decision;
    if (process.env.SVE_LOOT_TRACE && performance.now() >= nextTrace) {
      console.log(`${matchup} ${pad(number)} T${g.state.turn}, ${inputs.length} inputs, ${d.type}, seat ${d.player}`);
      nextTrace = performance.now() + 45_000;
    }
    const forcedPass = d.type === 'quick' && d.actions.every(a => a.type === 'pass');
    const by = forcedPass ? null : d.player;
    const input = forcedPass ? { type: 'quick', action: { type: 'pass' } }
      : by === 0 ? minePilot.decide(g) : hard.decide(g);
    if (by === 0 && minePilot.reason) authored.push({ at: inputs.length, reason: minePilot.reason });
    g.act(input, by ?? undefined);
    inputs.push({ input, by });
  }

  const verify = start(options);
  for (const { input, by } of inputs) verify.act(input, by ?? undefined);
  assert(g.result);
  assert.deepEqual(verify.state, g.state);
  const search = [minePilot.stats, hard.stats].map(s => ({ simulations: s.simulations, fallbacks: s.fallbacks, simulationFailures: s.simulationFailures }));
  const training = { ...metadata, authored, search, terminalHP: g.state.players.map(p => p.leaderDefense) };
  const replay = { format: 'sve-replay', version: 1, options, inputs, info: { result: g.result, turn: g.state.turn }, training };
  if (existsSync(file)) assert.deepEqual(read(file), replay);
  else save(file, JSON.stringify(replay) + '\n');
  console.log(`${matchup} ${pad(number)} r${revision} W=${g.result.winner} T${g.state.turn} HP=${training.terminalHP.join('/')} ${(performance.now() - began).toFixed(0)}ms`);
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === resolve(process.argv[1]).toLowerCase()) {
  const [matchup, number, revision, trial] = process.argv.slice(2);
  await play(matchup, Number(number), revision, trial);
}
