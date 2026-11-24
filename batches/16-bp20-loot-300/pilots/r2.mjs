import { buildPilot } from './r1.mjs';

const BARB = 'BP19-019', FLAG = 'BP19-T01', GUN = 'BP19-026';
const SCOUT = 'BP19-030', MATE = 'BP19-028', ORIGINAL = 'BP05-018';
const QUICK = 'BP15-026', AVARITIA = 'BP05-034';
const runeIdols = new Set(['BP05-037', 'BP05-048', 'BP05-T01', 'BP05-T02', 'BP08-050', 'BP15-039', 'BP15-049', 'BP15-054',
  'BP20-037', 'BP20-040', 'BP20-048', 'BP20-055', 'BP20-T03', 'BP20-T04']);

function count(cards, def) {
  let n = 0;
  for (const c of cards) if (!c.hidden && c.def === def && !c.abilitiesLost) n++;
  return n;
}

function reserveDamage(view, seat, matchup, mainAsEnd) {
  const us = view.players[seat], foe = view.players[1 - seat];
  const theirTurnNext = view.phase === 'end' || (view.phase === 'main' && mainAsEnd)
    ? view.activePlayer === seat : view.activePlayer !== seat;
  if (!theirTurnNext) return 0;

  const pp = Math.min(10, foe.maxPlayPoints + (view.activePlayer === seat ? 1 : 0));
  let attack = 0, easyQuick = 0;
  for (const c of foe.field) {
    if (c.hidden || c.type !== 'follower' || c.boxed || (view.activePlayer !== seat && c.engaged)) continue;
    attack += Math.max(0, c.attack);
    if (c.defense <= 2) easyQuick = Math.max(easyQuick, c.attack);
  }
  const quicks = count(us.hand, QUICK) + count(us.ex, QUICK);
  if (us.playPoints && quicks && easyQuick) attack -= Math.min(2, easyQuick);
  let reach = 0;
  if (matchup === 'dragon') {
    const fang = count(foe.ex, 'BP20-T05');
    const power = count(foe.field, 'BP05-052');
    const nation = count(foe.field, 'BP20-067');
    reach = (pp >= 7 ? 3.6 : pp >= 5 ? 2.0 : 0.55) + (power ? 1.8 * Math.min(2, fang + nation) : 0);
    if (pp >= 6 && (fang || nation)) reach += 1.0;
  } else if (matchup === 'rune') {
    let idols = 0;
    for (const c of foe.field) if (!c.hidden && runeIdols.has(c.def)) idols++;
    const black = count(foe.field, 'BP20-T04');
    const prayer = count(foe.field, 'BP20-048');
    const altar = count(foe.field, 'BP05-T02') + count(foe.ex, 'BP05-T02') * 0.5;
    const axia = count(foe.ex, 'BP20-040');
    const superReady = foe.superEvolutionPoints && foe.turnsPassed >= (view.firstPlayer === 1 - seat ? 6 : 5);
    reach = 2 * altar + (idols >= 2 ? Math.min(prayer, idols - 1) * 1.8 + black : 0);
    if (pp >= 4) reach += 1.4 + (superReady ? Math.min(4.5, idols * (axia ? 0.95 : 0.55)) : 0);
  } else {
    const flags = count(foe.ex, FLAG);
    const gunners = count(foe.field, GUN);
    const barb = count(foe.field, BARB);
    reach = pp >= 4 ? 1.7 : 0.5;
    reach += Math.min(flags, barb ? 4 : 2) * (0.65 + 0.75 * gunners);
    if (pp >= 4 && flags) reach += 0.6;
  }

  // This is the extra risk due to unmodeled burst. The native evaluation already
  // counts normal attacks, so its baseline is subtracted to avoid counting twice.
  const sigmoid = x => 1 / (1 + Math.exp(-x / 2.1));
  const gap = attack + 1.5 - us.leaderDefense;
  return 14 * Math.max(0, sigmoid(gap + reach) - sigmoid(gap));
}

function ownDelta(view, seat, matchup, mainAsEnd) {
  const us = view.players[seat], foe = view.players[1 - seat];
  let score = -reserveDamage(view, seat, matchup, mainAsEnd);
  const flags = count(us.ex, FLAG);
  const barb = count(us.hand, BARB) + count(us.ex, BARB);
  const ownBarb = count(us.field, BARB);
  const ownGunner = count(us.field, GUN);
  const flagSupply = count(us.hand, SCOUT) + count(us.hand, GUN) + count(us.hand, MATE);
  if (us.maxPlayPoints <= 4) {
    if (barb) score += us.maxPlayPoints === 3 ? 2.35 : 1.55;
    if (flags && (barb || (ownBarb && !ownGunner))) score += 0.58 * Math.min(flags, 3);
    if (!barb && !ownBarb && count(us.hand, MATE) && us.evolutionPoints) score += 0.65;
    if (count(us.hand, AVARITIA) && !ownBarb && !barb && us.hand.length <= 4) score += 0.35;
  }
  if (ownGunner && (ownBarb || count(us.field, 'BP15-020')) && (flags || flagSupply)) score += 1.4;
  if (us.playPoints && foe.field.some(c => !c.hidden && c.type === 'follower' && c.defense <= 2) &&
      (count(us.hand, QUICK) || count(us.ex, QUICK))) score += mainAsEnd ? 0.62 : 0.25;
  return score;
}

function barbSearch(view, seat) {
  const d = view.decision, me = view.players[seat], foe = view.players[1 - seat];
  if (d.type !== 'selectCards' || me.maxPlayPoints > 4 || foe.leaderDefense <= 6 || count(me.hand, BARB) ||
      count(me.field, BARB) || !d.candidateDefs?.includes(BARB)) return null;
  const source = [...me.field, ...view.resolution].find(c => !c.hidden && c.id === d.source);
  const from = source?.def || view.resolution.at(-1)?.def;
  if (from !== MATE && from !== AVARITIA) return null;
  const hasFlag = count(me.ex, FLAG) || count(me.hand, MATE) || count(me.hand, GUN) || count(me.hand, SCOUT);
  if (!hasFlag || me.leaderDefense < 7 || (!me.evolutionPoints && me.maxPlayPoints < 3 && from === AVARITIA && d.candidateDefs.includes(ORIGINAL))) return null;
  return { type: 'selectCards', cards: [d.candidates[d.candidateDefs.indexOf(BARB)]] };
}

export function makePilot(ctx) {
  const { rt, seat, matchup } = ctx;
  const base = rt.MEDIUM_V2;
  const adjust = (evaluator, asEnd) => (view, player) => {
    const value = ownDelta(view, seat, matchup, asEnd);
    return evaluator(view, player) + (player === seat ? value : -value);
  };
  const adapted = { ...rt, MEDIUM_V2: { ...base,
    evaluator: adjust(base.evaluator, true), replyEvaluator: adjust(base.replyEvaluator, false), greedyEvaluator: adjust(base.greedyEvaluator, false),
  } };
  const pilot = buildPilot({ ...ctx, rt: adapted }, { aggression: matchup === 'dragon' ? 0.68 : matchup === 'rune' ? 0.55 : 0.4,
    search: { beamWidth: 16, maxSimulations: 1550, maxBranches: 24, innerSimulations: 190, replyLethal: 145,
      closeSamples: { max: 4, z: 1.25, margin: 0.7, most: 2 },
      macro: { actions: 14, keep: 2, sub: 4, dec: 43, share: 0.24 },
    },
  });
  return {
    reason: null,
    get stats() { return pilot.stats; },
    decide(game) {
      const search = barbSearch(game.view(seat), seat);
      if (search) {
        this.reason = '已有或可补充旗帜，优先检索芭芭萝丝';
        return search;
      }
      const result = pilot.decide(game);
      this.reason = pilot.reason;
      return result;
    },
  };
}
