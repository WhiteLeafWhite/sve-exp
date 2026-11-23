// node game.mjs <opponent key> <game number 1–50> <deck version> <policy revision>
// The working directory is the simulator checkout. One game is one native replay.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, linkSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { makeBishopPlayer } from "../../skills/sve-bishop-matchups/scripts/bishop-player.mjs";
const root = dirname(fileURLToPath(import.meta.url));
const rt = await import(pathToFileURL(resolve("dist/bp20-training-engine.mjs")).href);
const [key, number, version = "A", strategy = "2", series = "explore"] = process.argv.slice(2);
assert(["explore", "fixed100", "lyrial", "dragonPolicy"].includes(series));
const fixed = series === "fixed100";
const paired = series === "lyrial";
const targeted = series === "dragonPolicy";
const archive = {fixed100:"09-bp20-fixed-300",lyrial:"09b-bp20-lyrial",dragonPolicy:"09c-bp20-dragon-policy"}[series];
const destination = archive ? join(root,"..",archive) : root;
const pins = {
  cQZr8Z: ["05", "ed8882da5252c802b10365452fee7185915cb764e46e3b5305e246c6529424fd"],
  zQrwne: ["06", "9416da999b748650b862702d9bbf970470089f6aace1182a43097cb5fca1bcf7"],
  t7B32v: ["07", "b38c1afaafd651e98f6ce06b231c4add661f91f6e8190c8b7da477027f586da2"],
};
assert(Object.hasOwn(pins, key) && /^[1-9]\d*$/.test(number) && Number(number) <= (fixed ? 100 : paired || targeted ? 5 : 50) && (paired ? version==="D" && strategy==="3" : /^[ABC]$/.test(version)));
if (targeted) assert(key==="zQrwne" && version==="B" && strategy==="4");
const read = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
const engine = rt.createEngine({ cards: rt.ALL_CARDS, scripts: rt.ALL_SCRIPTS });
const catalog = new rt.Catalog(rt.ALL_CARDS);
const bishop = rt.parseDeckFile(read(paired ? join(destination,"bishop.json") : join(root,"decks",version+".json")));
if (fixed) {
  const protocol = read(join(destination, "protocol.json"));
  assert.equal(version, protocol.deck);
  assert.equal(Number(strategy), protocol.policy);
  assert.deepEqual(bishop, rt.parseDeckFile(read(join(destination, "bishop.json"))));
}
const named = join(root, "..", pins[key][0] + "-" + key);
const opponent = rt.parseDeckFile(read(join(named, "opponent.json")));
const original = read(join(named, "source.json"));
assert.deepEqual([opponent.leader, opponent.main, opponent.evolve],
  [original.leader_card_no, original.basic_deck, original.evo_deck]);
const signature = (d) => createHash("sha256").update(JSON.stringify([
  d.leader, Object.entries(d.main).sort(), Object.entries(d.evolve).sort(),
])).digest("hex");
assert.equal(signature(opponent), pins[key][1]);
for (const printing of [bishop.leader, ...Object.keys(bishop.main), ...Object.keys(bishop.evolve)]) {
  assert(/^BP(0[1-9]|1\d|20)-/.test(printing), "Outside the selected BP01–20 pool: " + printing);
}
const list = { ...read("packages/gui/restrictions/10_26_JPN.json"), id: "10_26_JPN" };
const decks = [bishop, opponent].map((d) => rt.toDeckList(d));
assert.deepEqual(rt.formatProblems(bishop, "standard", list, catalog,
  engine.validateDeck(decks[0], { deckRestrictions: true })), []);
assert.deepEqual(engine.validateDeck(decks[1], { deckRestrictions: true }), []);
const seedNumber = Number(number) + (paired ? 75 : targeted ? 90 : 0);
const seed = (series!=="explore" ? "sve-exp/bp20-fixed-300/v1/" : "sve-exp/bp20-hard-150/v1/") + key + "/" + seedNumber;
const options = { seed, decks, deckNames: [bishop.name, opponent.name], controllers: ["human", "hard"],
  format: "standard", restrictionList: null, deckRestrictions: true, manualActions: false,
  showEveryMainPhase: true, askEveryQuickWindow: true, turnOrder: seedNumber % 2 ? "player1" : "player2" };
const config = rt.configOf(options);
const fingerprint = rt.engineFingerprint(resolve("packages/gui"));
const fresh = () => engine.newGame({ seed, players: decks, config });
const file = join(destination, key, "replays", number.padStart(2, "0") + ".json");
if (existsSync(file)) {
  const old = read(file);
  assert.deepEqual(old.options, options);
  assert.equal(old.training.policy, Number(strategy));
  assert.equal(old.training.engine, fingerprint);
  assert.equal(old.training.deckVersion, version);
  assert(old.info.result);
  console.log("Already completed", key, number);
} else {
  const game = fresh();
  const players = [
    makeBishopPlayer(engine, rt, { seat: 0, opponentKey: key, seed: "bishop/" + seed, revision: Number(strategy) }),
    rt.createPresetBot(engine, "hard-next", seed + ":hard:1", 1),
  ];
  const inputs = [];
  while (game.decision) {
    assert(inputs.length < 5000, "Unfinished game at 5000 inputs");
    const d = game.decision;
    const forcedPass = d.type === "quick" && d.actions.every((a) => a.type === "pass");
    const by = forcedPass ? null : d.player;
    const input = forcedPass ? { type: "quick", action: { type: "pass" } } : players[by].decide(game);
    game.act(input, by ?? undefined);
    inputs.push({ input, by });
  }
  const verify = fresh();
  for (const {input, by} of inputs) verify.act(input, by ?? undefined);
  assert(game.result && verify.result);
  assert.deepEqual(verify.state, game.state);
  const replay = { format: "sve-replay", version: 1, options, inputs, info: { result: game.result, turn: game.state.turn },
    training: { key, number: Number(number), deckVersion: version, policy: Number(strategy), engine: fingerprint,
      bishopHash: signature(bishop), opponentHash: signature(opponent), reviewedList: list.id, opponentPreset: "hard-next",
      opponentEffort: 1, hp: game.state.players.map((p) => p.leaderDefense),
      search: players.map((p) => ({ fallbacks: p.stats.fallbacks, failedSimulations: p.stats.simulationFailures })) } };
  mkdirSync(dirname(file), { recursive: true });
  const temp = file + "." + process.pid + ".tmp";
  try {
    writeFileSync(temp, JSON.stringify(replay) + "\n", { flag: "wx" });
    linkSync(temp, file);
  } finally { if (existsSync(temp)) unlinkSync(temp); }
  console.log(key, number, version, "winner", game.result.winner, "T" + game.state.turn, "inputs", inputs.length);
}
