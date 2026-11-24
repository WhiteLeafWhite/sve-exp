import { makePilot as useRuneBoard } from './r3.mjs';

const BARB = 'BP19-019', GUN = 'BP19-026', FLAG = 'BP19-T01';
const SCOUT = 'BP19-030', MATE = 'BP19-028', AVARITIA = 'BP05-034';
const EARLY = new Set([GUN, MATE, 'BP05-018', 'BP20-019', 'BP15-028', 'BP15-113']);
const FUEL = new Set([SCOUT, MATE, GUN]);

function fieldStats(side, idolatry) {
  let power = 0, followers = 0, idols = 0, amulets = 0;
  for (const c of side.field) {
    if (c.hidden || c.boxed) continue;
    if (c.type === 'follower') { followers++; power += c.attack; }
    if (idolatry.has(c.def)) { idols++; if (c.type === 'amulet') amulets++; }
  }
  return { power, followers, idols, amulets };
}

function chooseOpening(side, first) {
  const defs = side.hand.map(c => c.def);
  const bodies = defs.filter(c => EARLY.has(c)).length;
  const fuel = defs.filter(c => FUEL.has(c)).length;
  const one = defs.includes(SCOUT) || defs.includes('BP05-029');
  const barb = defs.includes(BARB), mate = defs.includes(MATE);
  if (one && bodies) return [false, '一、二费均能落随从'];
  if (mate && !first && (bodies >= 2 || defs.includes(AVARITIA) || barb)) return [false, '副船长二费可进化找四费线'];
  if (bodies >= 2 && (fuel || defs.includes('BP20-026') || defs.includes(AVARITIA))) return [false, '两费随从与清场或产旗'];
  if (one && fuel && barb) return [false, '已有造旗与四费芭芭萝丝'];
  return [true, '整手重抽补一二费场攻和可衔接的资源'];
}

function tempoValue(view, seat, idolatry, asEnd) {
  const us = view.players[seat], foe = view.players[1 - seat];
  const mine = fieldStats(us, idolatry), theirs = fieldStats(foe, idolatry);
  const turn = Math.max(us.turnsPassed, foe.turnsPassed);
  let value = 0;
  if (turn >= 2 && turn <= 5) {
    const margin = mine.power - theirs.power;
    value += .9 * Math.max(-5, Math.min(4, margin));
    if (theirs.idols >= 2 && theirs.idols > theirs.amulets) value -= 1.5;
  }
  // When the two public supports are amulets, ordinary removal cannot close
  // the gate. A credible race uses the opponent's PP already spent on them.
  if (theirs.amulets >= 2 && mine.power && foe.leaderDefense <= 14) {
    value += .33 * (20 - foe.leaderDefense);
    if (asEnd && view.activePlayer === seat && mine.followers && us.leaderDefense <= theirs.power + 6)
      value -= 1.2;
  }
  return value;
}

export function makePilot(ctx) {
  const { seat, engine, rt } = ctx;
  const base = rt.MEDIUM_V2;
  const idolatry = new Set(engine.db.all().filter(c => c.traits.includes('アイドル')).map(c => c.id));
  const addTempo = (score, asEnd) => (view, player) => {
    const extra = tempoValue(view, seat, idolatry, asEnd);
    return score(view, player) + (player === seat ? extra : -extra);
  };
  const responderValue = (view, player) => {
    const score = base.greedyEvaluator(view, player);
    if (player === seat) return score + tempoValue(view, seat, idolatry, false);
    const us = view.players[player], foe = view.players[seat];
    const mine = fieldStats(us, idolatry);
    const important = foe.field.filter(c => !c.hidden && !c.abilitiesLost && [BARB, GUN].includes(c.def)).length;
    return score + (mine.idols >= 2 ? 2.4 : 0) + .8 * mine.idols - 1.9 * important;
  };

  function search(compact) {
    const adaptive = class extends rt.PlannerBot {
      constructor(engine, options) {
        const size = compact
          ? { lookahead: 1, beamWidth: 12, maxSimulations: 880, maxBranches: 22, replyPlans: 4,
              replyModel: 'greedy', replyLethal: 160, closeSamples: undefined }
          : { maxSimulations: 1550, innerSimulations: 205, replyLethalOpp: 260 };
        super(engine, { ...options, ...size, modelEvaluator: responderValue });
      }
    };
    const changed = { ...rt, PlannerBot: adaptive, MEDIUM_V2: { ...base,
      evaluator: addTempo(base.evaluator, true), replyEvaluator: addTempo(base.replyEvaluator, false),
      greedyEvaluator: addTempo(base.greedyEvaluator, false),
    } };
    return useRuneBoard({ ...ctx, rt: changed, seed: `${ctx.seed}/${compact ? 'compact' : 'deep'}` });
  }
  const compact = search(true), deep = search(false);
  const turnUse = new Map();
  return {
    reason: null,
    get stats() {
      return Object.fromEntries(['simulations', 'fallbacks', 'simulationFailures'].map(k => [k, compact.stats[k] + deep.stats[k]]));
    },
    decide(game) {
      this.reason = null;
      const v = game.view(seat), d = v.decision;
      if (d.type === 'mulligan') {
        const [redraw, note] = chooseOpening(v.players[seat], v.firstPlayer === seat);
        this.reason = note;
        return { type: d.type, redraw };
      }
      if (d.type === 'mainPhase' && d.actions.length === 1) return { type: d.type, action: d.actions[0] };
      if (!turnUse.has(v.turn)) {
        const us = v.players[seat], foe = v.players[1 - seat];
        const rune = fieldStats(foe, idolatry);
        const keyTurn = v.activePlayer === seat && us.maxPlayPoints >= 4 && (
          (us.ex.filter(c => c.def === FLAG).length >= 2 && foe.leaderDefense <= 14) ||
          (us.leaderDefense <= 11 && rune.idols >= 2 && rune.followers >= 1));
        turnUse.set(v.turn, keyTurn ? deep : compact);
      }
      const chosen = turnUse.get(v.turn);
      const answer = chosen.decide(game);
      this.reason = chosen.reason;
      return answer;
    },
  };
}
