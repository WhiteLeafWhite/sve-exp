import { makePilot as withPublicBurst } from './r2.mjs';

const idols = new Set(['BP05-037', 'BP05-048', 'BP05-T01', 'BP05-T02', 'BP08-050', 'BP15-039', 'BP15-049', 'BP15-054',
  'BP20-037', 'BP20-040', 'BP20-048', 'BP20-055', 'BP20-T03', 'BP20-T04']);
const lishenna = new Set(['BP05-037', 'BP15-039', 'BP20-037']);
const DEFENSE_QUICK = 'BP15-026';

function runeBoardValue(view, seat, ownTurnEnding) {
  const own = view.players[seat], foe = view.players[1 - seat];
  const foeMovesNext = view.phase === 'end' || (ownTurnEnding && view.phase === 'main')
    ? view.activePlayer === seat : view.activePlayer !== seat;
  const foePP = Math.min(10, foe.maxPlayPoints + (view.activePlayer === seat ? 1 : 0));
  let count = 0, attacks = 0, zealots = 0;
  for (const c of foe.field) {
    if (c.hidden || !idols.has(c.def)) continue;
    count++;
    if (c.def === 'BP08-050') zealots++;
    if (c.type === 'follower' && !c.boxed) attacks += c.attack;
  }
  const followers = own.field.filter(c => !c.hidden && c.type === 'follower');
  const fuelEx = foe.ex.some(c => c.def === 'BP08-050');
  const revealedZealot = foe.hand.some(c => (c.hidden ? c.known?.def : c.def) === 'BP08-050');
  const revealedLishenna = foe.ex.some(c => lishenna.has(c.def));
  let value = 0;

  // Two standing Idolatry cards turn the next Zealot into removal, burn and a
  // heal. A third card turns on the Hermit's three damage as it arrives.
  if (foePP >= 3 && foe.turnsPassed <= 7) {
    value -= (count >= 2 ? 3.15 : 0) + (count >= 3 ? 0.7 : 0);
    if (count >= 2 && (fuelEx || revealedZealot || revealedLishenna)) value -= 1.45;
    if (count >= 2 && foeMovesNext && followers.length === 1 && (fuelEx || revealedZealot)) value -= 1.75;
  }
  if (foeMovesNext && attacks && own.leaderDefense <= attacks + 8) value -= 0.2 * attacks + 0.7 * zealots;
  if (own.playPoints && ownTurnEnding && view.activePlayer === seat && count >= 2 &&
      [...own.hand, ...own.ex].some(c => !c.hidden && c.def === DEFENSE_QUICK) &&
      foe.field.some(c => !c.hidden && c.type === 'follower' && idols.has(c.def) && c.defense <= 2)) value += 0.85;

  // Melody's Return pays with a Lishenna from the grave. Taking its last copy
  // can remove the route at the same time as putting a body in our EX.
  if (foePP >= 4 && !foe.cemetery.some(c => lishenna.has(c.def))) value += 1.1;
  return value;
}

export function makePilot(ctx) {
  const { rt, seat } = ctx;
  const base = rt.MEDIUM_V2;
  const augment = (score, ownTurnEnding) => (view, player) => {
    const value = runeBoardValue(view, seat, ownTurnEnding);
    return score(view, player) + (player === seat ? value : -value);
  };
  const betterReplies = class extends rt.PlannerBot {
    constructor(engine, options) {
      super(engine, { ...options, replyLethalOpp: 280, replyLethalKey: 'position',
        innerPlans: [4, 3], innerSimulations: 225, replyPlans: 6, lethalSearch: 1700 });
    }
  };
  const adapted = {
    ...rt,
    PlannerBot: betterReplies,
    MEDIUM_V2: { ...base, evaluator: augment(base.evaluator, true),
      replyEvaluator: augment(base.replyEvaluator, false), greedyEvaluator: augment(base.greedyEvaluator, false) },
  };
  return withPublicBurst({ ...ctx, rt: adapted });
}
