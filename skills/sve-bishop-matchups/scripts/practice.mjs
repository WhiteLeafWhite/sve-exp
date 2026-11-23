// Run from the SVE NEXT checkout using node --import tsx <this file>.
import { createHash, randomUUID } from "node:crypto";
import { makeBishopPlayer } from "./bishop-player.mjs";
import { existsSync, linkSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const { positionals: [command, ...files], values: opt } = parseArgs({
  allowPositionals: true,
  options: {
    seat: { type: "string", default: "0" }, first: { type: "string" }, seed: { type: "string" },
    list: { type: "string", default: "10_26_JPN" }, bot: { type: "string", default: "medium" },
    pilot: { type: "string", default: "medium" }, auto: { type: "boolean" }, matchup: { type: "string" },
    revision: { type: "string", default: "3" },
    at: { type: "string" }, pick: { type: "string" }, out: { type: "string" },
  },
});
if (!["play", "review", "branch"].includes(command) || files.length !== (command === "play" ? 2 : 1)) {
  throw Error("play <deck0.json> <deck1.json> --out <new replay> | review <replay> [--at N --seat 0|1] | branch <replay> --at N --out <new replay> [--pick I --auto]");
}
const seatNumber = (s) => {
  if (!["0", "1"].includes(s)) throw Error("Seat and first player are 0 or 1.");
  return Number(s);
};
const seat = seatNumber(opt.seat);
if (command !== "review" && (!opt.out || existsSync(opt.out))) throw Error("--out needs a new replay filename.");
if (command === "branch" && opt.at === undefined) throw Error("Supply --at with the number of inputs to replay.");
const read = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
const repoImport = (file) => import(pathToFileURL(resolve(file)).href);
const [core, sets, bots, { configOf, CONTROLLER_PRESETS }, { parseDeckFile, toDeckList }, { formatProblems }, { Catalog }, { engineFingerprint }] = await Promise.all([
  repoImport("packages/core/src/index.ts"), repoImport("packages/core/src/sets/index.ts"),
  repoImport("packages/bot/src/index.ts"), repoImport("packages/gui/src/engine/game-host.ts"),
  repoImport("packages/gui/src/decks/format.ts"), repoImport("packages/gui/src/formats/formats.ts"),
  repoImport("packages/gui/src/app/catalog.ts"), repoImport("packages/gui/fingerprint.ts"),
]);
const engine = core.createEngine({ cards: sets.ALL_CARDS, scripts: sets.ALL_SCRIPTS });
const fingerprint = engineFingerprint(resolve("packages/gui"));
const fairBots = ["medium", "medium-v2", "greedy"];
if (!["1","2","3","4"].includes(opt.revision)) throw Error("Choose a supported Bishop policy revision (1–4).");
const frozen = {
  cQZr8Z: "ed8882da5252c802b10365452fee7185915cb764e46e3b5305e246c6529424fd",
  zQrwne: "9416da999b748650b862702d9bbf970470089f6aace1182a43097cb5fca1bcf7",
  t7B32v: "b38c1afaafd651e98f6ce06b231c4add661f91f6e8190c8b7da477027f586da2",
};
if (opt.matchup && !Object.hasOwn(frozen, opt.matchup)) throw Error("Unknown frozen opponent.");
if (![...fairBots, "bishop"].includes(opt.pilot) || ![...fairBots, "hard"].includes(opt.bot)) throw Error("Use a fair pilot. The opponent may also be hard.");
const controllers = [opt.bot, opt.bot];
controllers[seat] = opt.auto && opt.pick === undefined && opt.pilot !== "bishop" ? opt.pilot : "human";
const loadBot = (name, seed, player, matchup) => {
  if (name === "bishop") {
    if (!Object.hasOwn(frozen, matchup)) throw Error("Supply --matchup and the matching fixed deck when using the Bishop pilot.");
    return makeBishopPlayer(engine, bots, { seat: player, opponentKey: matchup, seed: "bishop/" + seed, revision: Number(opt.revision) });
  }
  const key = [seed, name, player].join(":");
  return name === "greedy" ? bots.createBot(engine, "easy", key)
    : bots.createPresetBot(engine, CONTROLLER_PRESETS[name], key, 1);
};

function newReplay() {
  if (!/^[A-Za-z0-9_]+$/.test(opt.list)) throw Error("Invalid restriction list ID.");
  const list = { ...read(join("packages/gui/restrictions", opt.list + ".json")), id: opt.list };
  if (list.format !== "standard") throw Error("Choose a Standard restriction list.");
  const catalog = new Catalog(sets.ALL_CARDS);
  const decks = files.map((f) => parseDeckFile(read(f)));
  const players = decks.map((d, i) => {
    const player = toDeckList(d);
    const ordinary = engine.validateDeck(player, { deckRestrictions: true });
    const fixedOpponent = opt.matchup && i !== seat;
    if (fixedOpponent) {
      const hash = createHash("sha256").update(JSON.stringify([d.leader, Object.entries(d.main).sort(), Object.entries(d.evolve).sort()])).digest("hex");
      if (hash !== frozen[opt.matchup]) throw Error("The opposing deck differs from the selected frozen list.");
    } else if (opt.matchup && (catalog.printing(d.leader)?.class !== "Havencraft" ||
      [d.leader, ...Object.keys(d.main), ...Object.keys(d.evolve)].some((n) => !/^BP(0[1-9]|1\d|20)-/.test(n)))) {
      throw Error("Select a Bishop deck from BP01–20 for this practice.");
    }
    const issues = fixedOpponent ? ordinary : formatProblems(d, "standard", list, catalog, ordinary);
    if (issues.length) throw Error(d.name + " · " + JSON.stringify(issues));
    return player;
  });
  return { format: "sve-replay", version: 1, inputs: [], options: {
    seed: opt.seed ?? randomUUID(), decks: players, deckNames: decks.map((d) => d.name),
    format: "standard", restrictionList: opt.matchup ? null : opt.list, deckRestrictions: true, controllers,
    turnOrder: opt.first === undefined ? "choose" : ["player1", "player2"][seatNumber(opt.first)],
  } };
}

// Hidden zones come exclusively from the engine's seat view. Suppress instance IDs on unknown
// cards as well. A revealed card that returned to a hand can legitimately be remembered.
function describeCard(c) {
  if (c.hidden) return c.known ? { known: c.known.printing } : "?";
  const shown = { id: c.id, printing: c.printing, name: engine.db.get(c.def).names.cn || c.name, type: c.type };
  for (const k of ["cost", "attack", "defense", "linkedTo", "evolvedWith"]) {
    if (c[k] != null) shown[k] = c[k];
  }
  for (const k of ["engaged", "backFace", "boxed", "superEvolved", "abilitiesLost", "damage"]) {
    if (c[k]) shown[k] = c[k];
  }
  if (!c.faceUp) shown.faceDown = true;
  if (c.owner !== c.controller) shown.owner = c.owner;
  if (c.keywords.length) shown.keywords = c.keywords;
  if (c.gifts.length) shown.gifts = c.gifts;
  if (Object.keys(c.counters).length) shown.counters = c.counters;
  return shown;
}

function sideView(side) {
  const out = {};
  for (const [k, v] of Object.entries(side)) {
    if (Array.isArray(v)) {
      if (v.length) out[k] = v.map(describeCard);
    } else if (k === "leader") out[k] = v ? describeCard(v) : null;
    else out[k] = v;
  }
  return out;
}

function recentMoves(events, player) {
  return events.filter((e) => e.type === "cardsMoved").flatMap((e) =>
    core.redactEvent(e, player).moves.filter((m) => m.def).map((m) => ({
      card: m.printing || m.def, from: m.from?.zone ?? null, to: m.to.zone, player: m.to.player,
    }))
  );
}

function observe(game, index, moves) {
  const view = game.view(seat);
  const choices = view.decision ? core.enumerateAnswers(view.decision, 40) : { answers: [], complete: true };
  const { players, resolution, ...other } = view;
  console.log(JSON.stringify({ inputIndex: index, ...other, players: players.map(sideView),
    resolution: resolution.map(describeCard), recentVisibleMoves: moves,
    choices: choices.answers, truncated: !choices.complete }));
  return choices.answers;
}

function pickAnswer(line, choices, decision) {
  const answer = /^\d+$/.test(line) ? choices[Number(line)] : JSON.parse(line);
  if (!answer || typeof answer !== "object") throw Error("Choose a listed index starting at 0 or enter an Answer object.");
  const problem = core.validateAnswer(decision, answer);
  if (problem) throw Error(problem);
  return answer;
}

function saveReplay(path, replay) {
  const full = resolve(path);
  mkdirSync(dirname(full), { recursive: true });
  const pending = full + "." + randomUUID() + ".tmp";
  try {
    writeFileSync(pending, JSON.stringify(replay) + "\n", { flag: "wx" });
    linkSync(pending, full); // Publish a complete, new replay, including on concurrent runs.
  } finally {
    if (existsSync(pending)) unlinkSync(pending);
  }
}

const replay = command === "play" ? newReplay() : read(files[0]);
if (replay.format !== "sve-replay" || replay.version !== 1) throw Error("Expected an SVE NEXT v1 replay.");
const replayFingerprint = replay.practice?.fingerprint || replay.training?.engine;
if (replayFingerprint && replayFingerprint !== fingerprint) throw Error("Replay engine fingerprint differs from this checkout.");
const options = replay.options;
const game = engine.newGame({ seed: options.seed, players: options.decks, config: configOf(options) });
const prefix = opt.at === undefined ? replay.inputs.length : Number(opt.at);
if (!Number.isSafeInteger(prefix) || prefix < 0 || prefix > replay.inputs.length) throw Error("--at is a zero-based input boundary in this replay.");
let moves = recentMoves(game.startupEvents, seat);
const turns = [];
for (let i = 0; i < prefix; i++) {
  const v = game.view(seat);
  if (v.turn !== turns.at(-1)?.turn) {
    turns.push({ turn: v.turn, input: i, active: v.activePlayer, hp: v.players.map((p) => p.leaderDefense) });
  }
  if (v.decision) moves = [];
  const { input, by } = replay.inputs[i];
  moves.push(...recentMoves(game.act(input, by ?? undefined), seat));
}

if (command === "review") {
  if (opt.at !== undefined) observe(game, prefix, moves);
  else {
    const end = game.view(seat);
    if (replay.info && (end.turn !== replay.info.turn ||
        (end.result === null) !== (replay.info.result === null) || end.result?.winner !== replay.info.result?.winner)) {
      throw Error("The replayed result or turn count differs from the recording.");
    }
    console.log(JSON.stringify({ decks: options.deckNames, inputs: prefix, first: end.firstPlayer,
      result: end.result, turn: end.turn, turns, engine: fingerprint }));
  }
} else {
  if (!game.decision) throw Error("There is no pending decision at that point.");
  if (command === "branch" && game.decision.player !== seat) throw Error("Choose --seat matching the decision at --at.");
  const inputs = replay.inputs.slice(0, prefix);
  const played = [];
  const matchup = opt.matchup || replay.training?.key || replay.practice?.matchup;
  const players = [0, 1].map((p) => loadBot(p === seat ? opt.pilot : opt.bot, options.seed, p, matchup));
  let scripted = opt.pick;
  let automatic = !!opt.auto;
  const reader = automatic ? null : createInterface({ input: process.stdin, terminal: false });
  const lines = reader?.[Symbol.asyncIterator]();
  try {
    while (game.decision) {
      const d = game.decision;
      let input;
      if (d.player === seat && (!automatic || scripted !== undefined)) {
        const choices = observe(game, inputs.length, moves);
        moves = [];
        while (!input) {
          let line = scripted;
          if (line === undefined) {
            console.log("0-based choice, Answer JSON, bot (one decision), or finish (hand the rest to the pilot):");
            const next = await lines.next();
            if (next.done) throw Error("Input ended before the game finished.");
            line = next.value.trim();
          }
          if (line === "finish") automatic = true;
          if (line === "bot" || line === "finish") input = players[seat].decide(game);
          else {
            try { input = pickAnswer(line, choices, d); }
            catch (err) {
              if (scripted !== undefined) throw err;
              console.error(err.message);
              continue;
            }
            played.push(inputs.length);
          }
          scripted = undefined;
        }
      } else input = players[d.player].decide(game);
      const onlyPass = d.type === "quick" && d.actions.every((a) => a.type === "pass");
      const by = onlyPass && !options.ownQuickWindows ? null : d.player;
      const events = game.act(input, by ?? undefined);
      if (!automatic) moves.push(...recentMoves(events, seat));
      inputs.push({ input, by });
    }
  } finally { reader?.close(); }
  const end = game.view(seat);
  const result = { result: end.result, turn: end.turn };
  const practice = { fingerprint, seat, matchup, pilot: opt.pilot, ...(opt.pilot==="bishop"?{revision:Number(opt.revision)}:{}), opponent: opt.bot, manualInputs: played,
    ...(command === "branch" ? { source: basename(files[0]), fromInput: prefix } : {}) };
  saveReplay(opt.out, { format: "sve-replay", version: 1, options: { ...options, controllers }, inputs, info: result, practice });
  console.log(JSON.stringify({ ...result, inputs: inputs.length, manualInputs: played, saved: resolve(opt.out) }));
}
