import { makePilot as searchBurst } from './r7.mjs';

const GUN = 'BP19-026', BARB = 'BP19-019', FLAG = 'BP19-T01', ZEALOT = 'BP08-050';

function saveEngine(view, seat, atEnd, idols) {
  const us = view.players[seat], foe = view.players[1 - seat];
  if (us.maxPlayPoints < 2 || us.maxPlayPoints > 4 || view.phase === 'setup') return 0;
  const willMove = view.phase === 'end' || (atEnd && view.phase === 'main') ? view.activePlayer === seat : view.activePlayer !== seat;
  if (!willMove) return 0;
  const foesPP = foe.maxPlayPoints + (view.activePlayer === seat ? 1 : 0);
  if (foesPP < 3 || foesPP > 5) return 0;
  const onField = foe.field.filter(c => !c.hidden && idols.has(c.def));
  if (onField.length < 2) return 0;
  const visible = foe.ex.some(c => c.def === ZEALOT) || foe.hand.some(c => (c.hidden ? c.known?.def : c.def) === ZEALOT);
  const own = us.field.filter(c => !c.hidden && c.type === 'follower');
  let value = 0;
  if (own.length === 1 && [GUN, BARB].includes(own[0].def) && foe.leaderDefense >= 9) {
    // An isolated engine is the best Fanfare target. Reward a line in which
    // the same resource can be played alongside Loot when our PP refresh.
    value -= visible ? 4.2 : foe.hand.length >= 3 ? 2.65 : 1.25;
  }
  if (us.ex.some(c => c.def === FLAG) && us.hand.some(c => !c.hidden && c.def === GUN)) value += 0.55;
  return value;
}

export function makePilot(ctx) {
  const { engine, rt, seat } = ctx;
  const idols = new Set(engine.db.all().filter(c => c.traits.includes('アイドル')).map(c => c.id));
  const m = rt.MEDIUM_V2;
  const add = (base, end) => (view, player) => {
    const delta = saveEngine(view, seat, end, idols);
    return base(view, player) + (player === seat ? delta : -delta);
  };
  return searchBurst({ ...ctx, rt: { ...rt, MEDIUM_V2: { ...m,
    evaluator: add(m.evaluator, true), replyEvaluator: add(m.replyEvaluator, false),
    greedyEvaluator: add(m.greedyEvaluator, false),
  } } });
}
