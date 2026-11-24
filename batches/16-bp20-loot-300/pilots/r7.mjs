import { makePilot as playTempo } from './r5.mjs';

const BARB = 'BP19-019', FLAG = 'BP19-T01', GUN = 'BP19-026';
const PIRATES = new Set([BARB, GUN, 'BP19-028', 'BP19-030']);

function stock(side) {
  const units = side.field.filter(c => !c.hidden && c.type === 'follower' && !c.boxed);
  return { units, flags: side.ex.filter(c => c.def === FLAG).length, guns: units.filter(c => !c.abilitiesLost && c.def === GUN).length,
    barb: [...units, ...side.hand, ...side.ex].some(c => !c.hidden && !c.abilitiesLost && c.def === BARB),
    pirates: units.filter(c => PIRATES.has(c.def)).length };
}

function finishValue(view, seat, endOfTurn) {
  const us = view.players[seat], foe = view.players[1 - seat];
  const s = stock(us);
  if (us.maxPlayPoints < 3 || !s.flags || !s.pirates) return 0;
  // A flag on a pirate can deal one and add one to a later attack. Only count
  // the cannon damage from live gunners; a second copy in hand isn't a shot yet.
  const flagReach = Math.min(s.flags, s.barb ? 4 : 2) * (1 + s.guns + 0.6);
  const attack = s.units.reduce((n, c) => n + (endOfTurn || view.activePlayer !== seat || !c.engaged ? c.attack : 0), 0);
  const quickBuffer = foe.playPoints >= 2 ? 2.2 : 0.7;
  const low = 1 / (1 + Math.exp((foe.leaderDefense + quickBuffer - attack - flagReach) / 2.2));
  return 6.5 * low + .35 * Math.min(3, s.flags) * (s.guns ? 1.2 : 0.55);
}

export function makePilot(ctx) {
  const { rt, seat } = ctx;
  const installed = rt.MEDIUM_V2;
  const augment = (score, end) => (view, player) => {
    const extra = finishValue(view, seat, end);
    return score(view, player) + (player === seat ? extra : -extra);
  };
  class AlternateBudget {
    constructor(engine, options) {
      this.normal = new rt.PlannerBot(engine, options);
      this.burst = options.lookahead === 1 ? new rt.PlannerBot(engine, { ...options, seed: `${options.seed}/burst`,
        lookahead: 2, samples: 2, beamWidth: 17, maxSimulations: 1700, replyPlans: 6,
        innerBeam: 5, innerPlans: [3, 3], innerSimulations: 205, lethalSearch: 1750,
        closeSamples: { max: 4, z: 1.25, margin: 1, most: 2 },
      }) : null;
      this.byTurn = new Map();
    }
    get stats() {
      return Object.fromEntries(['simulations', 'fallbacks', 'simulationFailures'].map(k => [k, this.normal.stats[k] + (this.burst?.stats[k] ?? 0)]));
    }
    decide(game) {
      if (!this.burst) return this.normal.decide(game);
      const v = game.view(seat);
      if (!this.byTurn.has(v.turn)) {
        const us = v.players[seat], s = stock(us);
        const ready = v.activePlayer === seat && us.maxPlayPoints >= 4 && s.flags > 0 &&
          (s.barb || (s.guns >= 2 && s.pirates));
        this.byTurn.set(v.turn, ready ? this.burst : this.normal);
      }
      return this.byTurn.get(v.turn).decide(game);
    }
  }
  const wrapped = { ...rt, PlannerBot: AlternateBudget, MEDIUM_V2: { ...installed,
    evaluator: augment(installed.evaluator, true), replyEvaluator: augment(installed.replyEvaluator, false),
    greedyEvaluator: augment(installed.greedyEvaluator, false),
  } };
  return playTempo({ ...ctx, rt: wrapped });
}
