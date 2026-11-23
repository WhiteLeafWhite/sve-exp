// node game.mjs <opponent key> <game number 1–50> <deck version> <policy revision>
// The working directory is the simulator checkout. One game is one native replay.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, linkSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { makeBishopPlayer } from "../../skills/sve-bishop-matchups/scripts/bishop-player.mjs";
const root = dirname(fileURLToPath(import.meta.url));
const [key, number, version = "A", strategy = "2", series = "explore"] = process.argv.slice(2);
const secondSaito = series === "secondSaito" || series === "saitoControl";
const sheep = series === "sheep";
const trained = series === "trained";
const runtime = trained ? "dist/bp20-duel-engine.mjs" : "dist/bp20-training-engine.mjs";
const rt = await import(pathToFileURL(resolve(runtime)).href);
const knightTrial = series === "knight" || series === "knightControl";
assert(secondSaito || sheep || trained || knightTrial || ["explore", "fixed100", "lyrial", "dragonPolicy", "banish", "opening", "openingControl"].includes(series));
const fixed = series === "fixed100";
const pairedVersion = {lyrial:"D", banish:"E"}[series];
const targeted = series === "dragonPolicy";
const opening = series === "opening" || series === "openingControl";
const archive = {fixed100:"09-bp20-fixed-300",lyrial:"09b-bp20-lyrial",dragonPolicy:"09c-bp20-dragon-policy",banish:"09d-bp20-banish",opening:"11-dragon-mulligan/candidate",openingControl:"11-dragon-mulligan/control",secondSaito:"12-second-saito/candidate",saitoControl:"12-second-saito/control",sheep:"13-sacred-sheep",trained:"14-trained-pilot"}[series];
const destination = archive ? join(root,"..",archive) : root;
const knightRoot = join(root,"../15-heavenly-knight");
const outputRoot = knightTrial ? join(knightRoot,series==="knight"?"candidate":"control") : destination;
const pins = {
  cQZr8Z: ["05", "ed8882da5252c802b10365452fee7185915cb764e46e3b5305e246c6529424fd"],
  zQrwne: ["06", "9416da999b748650b862702d9bbf970470089f6aace1182a43097cb5fca1bcf7"],
  t7B32v: ["07", "b38c1afaafd651e98f6ce06b231c4add661f91f6e8190c8b7da477027f586da2"],
};
const limit = sheep ? 10 : trained ? 20 : fixed || series === "opening" || secondSaito ? 100 : pairedVersion || targeted ? 5 : 50;
assert(Object.hasOwn(pins, key) && /^[1-9]\d*$/.test(number) && Number(number) <= limit);
if(knightTrial) assert(strategy === "3" && version === (series==="knight"?"K":"F"));
else if(trained) assert(strategy === "3" && version === "F");
else if(sheep) assert(strategy === "3" && version === "S");
else if(secondSaito) assert(strategy === "3" && version === (series === "secondSaito" ? "F" : "B"));
else assert(pairedVersion ? version === pairedVersion && strategy === "3" : /^[ABC]$/.test(version));
if (targeted) assert(key==="zQrwne" && version==="B" && strategy==="4");
if (opening) assert(key==="zQrwne" && version==="B" && strategy===(series==="opening"?"5":"3"));
const read = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
const engine = rt.createEngine({ cards: rt.ALL_CARDS, scripts: rt.ALL_SCRIPTS });
const catalog = new rt.Catalog(rt.ALL_CARDS);
const bishopFile = series==="knight" ? join(knightRoot,"bishop.json") : trained || series==="knightControl" ? join(root,"../12-second-saito/candidate/bishop.json") : pairedVersion || secondSaito || sheep ? join(destination,"bishop.json") : join(root,"decks",version+".json");
const bishop = rt.parseDeckFile(read(bishopFile));
if (secondSaito) {
  const expected = rt.parseDeckFile(read(join(root,"decks","B.json")));
  if (series === "secondSaito") {
    expected.evolve["BP15-095"] -= 1;
    expected.evolve["BP18-118"] += 1;
  }
  assert.deepEqual([bishop.leader,bishop.main,bishop.evolve],[expected.leader,expected.main,expected.evolve]);
}
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
if (sheep || series==="knight") {
  const f = rt.toDeckList(rt.parseDeckFile(read(join(root,"../12-second-saito/candidate/bishop.json"))));
  assert.equal(decks[0].leader, f.leader);
  assert.deepEqual(decks[0].evolve, f.evolve);
  const controlled = [...f.main];
  for (const removed of [sheep ? "BP18-104" : "BP14-090", "BP19-095"]) {
    const index = controlled.lastIndexOf(removed);
    assert(index >= 0);
    controlled[index] = sheep ? "BP20-099" : "BP09-091";
  }
  assert.deepEqual([...controlled].sort(), [...decks[0].main].sort());
  decks[0] = {...decks[0], main:controlled};
}
assert.deepEqual(rt.formatProblems(bishop, "standard", list, catalog,
  engine.validateDeck(decks[0], { deckRestrictions: true })), []);
assert.deepEqual(engine.validateDeck(decks[1], { deckRestrictions: true }), []);
const seedNumber = series==="openingControl" ? 2*Number(number)-1 : Number(number) + ({lyrial:75, dragonPolicy:90, banish:95, sheep:60, trained:70}[series] ?? 0);
const prefix = knightTrial ? "sve-exp/bp20-heavenly-knight/v1/" : secondSaito || sheep || trained ? "sve-exp/bp20-second-saito/v1/" : opening ? "sve-exp/bp20-dragon-mulligan/v1/" : series!=="explore" ? "sve-exp/bp20-fixed-300/v1/" : "sve-exp/bp20-hard-150/v1/";
const seed = prefix + key + "/" + seedNumber;
const options = { seed, decks, deckNames: [bishop.name, opponent.name], controllers: ["human", "hard"],
  format: "standard", restrictionList: null, deckRestrictions: true, manualActions: false,
  showEveryMainPhase: true, askEveryQuickWindow: true, turnOrder: seedNumber % 2 ? "player1" : "player2" };
const config = rt.configOf(options);
const fingerprint = rt.engineFingerprint(resolve("packages/gui"));
const fresh = () => engine.newGame({ seed, players: decks, config });
let coach, seatStrategy, seatHash;
const authored=[];
if(trained){
  const duel=join(root,"../10-agent-duels");
  seatHash=read(join(duel,"checks/003.json")).nextPolicies.bishop;
  assert(/^[a-f0-9]{64}$/.test(seatHash));
  const source=join(duel,"pilots/history",seatHash+".mjs");
  assert.equal(createHash("sha256").update(readFileSync(source)).digest("hex"),seatHash);
  coach=await import(pathToFileURL(source).href);
  assert.equal(coach.baseRevision??3,3);
  ({seatStrategy}=await import(pathToFileURL(join(duel,"seat-strategy.mjs")).href));
}
const file = join(outputRoot, key, "replays", number.padStart(2, "0") + ".json");
if (existsSync(file)) {
  const old = read(file);
  assert.deepEqual(old.options, options);
  assert.equal(old.training.policy, Number(strategy));
  assert.equal(old.training.engine, fingerprint);
  assert.equal(old.training.deckVersion, version);
  if(trained)assert.equal(old.training.seatPilot.hash,seatHash);
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
    if (series!=="explore" && existsSync(resolve("dist/quota-checkpoints/stop"))) {
      console.log("Weekly cutoff. This unfinished game was excluded:",key,number,inputs.length);
      process.exit(3);
    }
    assert(inputs.length < 5000, "Unfinished game at 5000 inputs");
    const d = game.decision;
    const forcedPass = d.type === "quick" && d.actions.every((a) => a.type === "pass");
    const by = forcedPass ? null : d.player;
    let input;
    if(trained && by===0){
      const {answers}=rt.enumerateAnswers(d,180);
      const chosen=seatStrategy(game,0,key,answers,coach,players[0],2);
      input=chosen.input;
      if(chosen.authored)authored.push({at:inputs.length,turn:game.state.turn,decision:d.type,options:answers.length});
    }else input=forcedPass ? { type: "quick", action: { type: "pass" } } : players[by].decide(game);
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
      ...(trained ? {seatPilot:{checkpoint:3,hash:seatHash,viewVersion:2,authored}} : {}),
      search: players.map((p) => ({ fallbacks: p.stats.fallbacks, failedSimulations: p.stats.simulationFailures })) } };
  mkdirSync(dirname(file), { recursive: true });
  const temp = file + "." + process.pid + ".tmp";
  try {
    writeFileSync(temp, JSON.stringify(replay) + "\n", { flag: "wx" });
    linkSync(temp, file);
  } finally { if (existsSync(temp)) unlinkSync(temp); }
  console.log(key, number, version, "winner", game.result.winner, "T" + game.state.turn, "inputs", inputs.length);
}
