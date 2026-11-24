import { makePilot as playBurst } from './r8.mjs';

const MONO = 'BP05-045', FLAG = 'BP19-T01', GUN = 'BP19-026';

function quickWindow(view, seat, idols) {
  if (view.activePlayer !== seat || view.phase === 'setup') return 0;
  const us = view.players[seat], foe = view.players[1 - seat];
  if (us.maxPlayPoints < 3) return 0;
  const visibleQuick = foe.ex.some(c => c.def === MONO);
  const opponentOpen = foe.playPoints < 2 && !visibleQuick;
  const own = us.field.filter(c => !c.hidden && c.type === 'follower' && !c.boxed);
  if (opponentOpen) {
    // An end phase with insufficient opposing PP is our chance to turn
    // current flag stock and board attack into damage before their refill.
    const loaded = us.ex.some(c => c.def === FLAG) || own.some(c => c.attack >= 3);
    return loaded && us.leaderDefense >= 7 ? 0.54 * (20 - foe.leaderDefense) : 0.24 * (20 - foe.leaderDefense);
  }
  const count = foe.field.filter(c => !c.hidden && idols.has(c.def)).length;
  if (count >= 2 && own.some(c => !c.engaged && c.def === GUN && c.defense <= 2)) return -1.6;
  return 0;
}

export function makePilot(ctx) {
  const { engine, rt, seat } = ctx;
  const idols = new Set(engine.db.all().filter(c => c.traits.includes('アイドル')).map(c => c.id));
  const m = rt.MEDIUM_V2;
  const add = score => (view, player) => {
    const delta = quickWindow(view, seat, idols);
    return score(view, player) + (player === seat ? delta : -delta);
  };
  return playBurst({ ...ctx, rt: { ...rt, MEDIUM_V2: { ...m,
    evaluator: add(m.evaluator), replyEvaluator: add(m.replyEvaluator), greedyEvaluator: add(m.greedyEvaluator),
  } } });
}
