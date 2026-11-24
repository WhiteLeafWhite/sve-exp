import { makePilot as makeFullPilot } from './r2.mjs';

function forced(d) {
  if (d.type === 'mainPhase' && d.actions.length === 1) return { type: d.type, action: d.actions[0] };
  if (d.type === 'selectCards' && d.min === d.candidates.length) return { type: d.type, cards: d.candidates };
  if (d.type === 'selectPending' && d.options.length === 1) return { type: d.type, id: d.options[0] };
  if (d.type === 'choose' && d.min === d.options.length) return { type: d.type, ids: d.options.map(o => o.id) };
  if (d.type === 'orderCards' && d.cards.length <= 1) return { type: d.type, order: d.cards.map(c => c.id) };
  return null;
}

export function makePilot(ctx) {
  const compactSearch = class extends ctx.rt.PlannerBot {
    constructor(engine, options) {
      super(engine, { ...options, lookahead: 1, beamWidth: 12, maxSimulations: 780,
        maxBranches: 20, replyPlans: 4, replyLethal: 120, replyModel: 'greedy', closeSamples: undefined });
    }
  };
  const normal = makeFullPilot({ ...ctx, rt: { ...ctx.rt, PlannerBot: compactSearch }, seed: `${ctx.seed}/compact` });
  const critical = makeFullPilot({ ...ctx, seed: `${ctx.seed}/critical` });
  const byTurn = new Map();
  return {
    reason: null,
    get stats() {
      const values = {};
      for (const key of ['simulations', 'fallbacks', 'simulationFailures']) values[key] = normal.stats[key] + critical.stats[key];
      return values;
    },
    decide(game) {
      this.reason = null;
      const view = game.view(ctx.seat);
      const answer = forced(view.decision);
      if (answer) return answer;
      if (!byTurn.has(view.turn)) {
        const ours = view.players[ctx.seat], foe = view.players[1 - ctx.seat];
        const ownTurn = view.activePlayer === ctx.seat;
        const enemyBoard = foe.field.filter(c => !c.hidden && c.type === 'follower');
        const ownFlags = ours.ex.filter(c => c.def === 'BP19-T01').length;
        const foeFlags = foe.ex.filter(c => c.def === 'BP19-T01').length;
        const closeRace = ours.maxPlayPoints >= 4 && ours.leaderDefense <= 10 &&
          (enemyBoard.length >= 2 || foeFlags >= 2);
        const possibleCombo = ownTurn && ours.maxPlayPoints >= 5 && foe.playPoints > 0 && ownFlags >= 2 && foe.leaderDefense <= 13;
        byTurn.set(view.turn, closeRace || possibleCombo ? critical : normal);
      }
      const pilot = byTurn.get(view.turn);
      const result = pilot.decide(game);
      this.reason = pilot.reason;
      return result;
    },
  };
}
