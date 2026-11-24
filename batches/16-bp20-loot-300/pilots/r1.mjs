// All deck-specific evaluations and scripted choices take a PlayerView.
// The rules engine samples hidden cards for the fair PlannerBot.
const FLAG = 'BP19-T01';
const BARBAROS = 'BP19-019';
const GUNNER = 'BP19-026';
const SCOUT = 'BP19-030';
const MATE = 'BP19-028';
const ORIGINAL = 'BP05-018';
const HOLLOW = 'BP15-020';
const MANIFEST = 'BP20-019';
const AVARITIA = 'BP05-034';
const SERVANT = 'BP05-029';
const SLASH = 'BP20-026';
const HOLLOW_QUICK = 'BP15-026';
const LOOT = new Set([FLAG, 'BP15-T01', 'BP15-T02', 'BP15-T03', 'BP15-PR10', SLASH, HOLLOW_QUICK]);

function is(c, def) {
  return !c.hidden && c.def === def;
}

function live(c, def) {
  return is(c, def) && !c.abilitiesLost;
}

function opening(view, seat, matchup) {
  const me = view.players[seat];
  const first = view.firstPlayer === seat;
  const count = ids => me.hand.filter(c => ids.includes(c.def)).length;
  const ones = count([SCOUT, SERVANT]);
  const flags = count([SCOUT, MATE, GUNNER]);
  const setup = count([ORIGINAL, GUNNER, MATE, MANIFEST, 'BP15-028', 'BP15-113']);
  const barb = count([BARBAROS]);
  const search = count([AVARITIA]);
  const hollow = count([HOLLOW]);
  const quick = count([HOLLOW_QUICK]);
  if (ones && (setup || barb || hollow || search || ones > 1)) return [false, '一费盗贼与后续曲线'];
  if (flags && barb && (setup >= 2 || search || !first)) return [false, '造旗与芭芭萝丝四费线'];
  if (setup >= 2 && (search || !first || (flags && (matchup === 'mirror' || hollow)))) return [false, '双两费随从与衔接'];
  if (search && setup && (hollow || (quick && matchup !== 'dragon'))) return [false, '艾巴利缇亚补牌且已有两费落点'];
  return [true, '重抽缺早期场面或后续的整手'];
}

const enemyPriority = {
  dragon: { 'BP15-057': 4.1, 'BP05-052': 3.2, 'BP15-066': 2.35, 'BP20-062': 2.8, 'BP05-055': 1.7, 'BP20-056': 1.25 },
  rune: { 'BP20-048': 2.5, 'BP20-040': 2.05, 'BP08-050': 1.05, 'BP20-T04': 1.5, 'BP05-T02': 1.2, 'BP20-055': 0.55 },
  mirror: {},
};

function lootValue(side, opposite) {
  let flags = 0, tokens = 0, value = 0;
  for (const c of side.ex) {
    if (c.def === FLAG) flags++;
    if (LOOT.has(c.def)) tokens++;
  }
  const ready = opposite.cemetery.length >= 10;
  let gunners = 0, thieves = 0;
  for (const c of side.field) {
    if (c.hidden || c.abilitiesLost || c.type !== 'follower') continue;
    if (c.def === GUNNER) gunners++;
    if (c.def === BARBAROS) value += (c.evolvedWith ? 4.0 : 2.8) + 0.48 * Math.min(tokens, 4);
    if (c.def === HOLLOW) value += 2.05 + 0.55 * Math.min(tokens, 3);
    if (c.def === ORIGINAL && c.evolvedWith) value += (ready ? 3.05 : 1.2) + 0.48 * Math.min(side.ex.length, 4);
    if (c.def === 'BP15-028' && c.evolvedWith) value += 0.45 + (ready ? 0.4 : 0);
    if (c.def === MANIFEST) value += 0.50;
    if (c.def === SCOUT || c.def === MATE || c.def === BARBAROS || c.def === GUNNER) thieves++;
  }
  value += gunners * (1.55 + 0.55 * Math.min(flags, 3)) + 0.62 * Math.min(flags, 4);
  if (thieves && flags) value += 0.25;
  // The tenth card switches on zero-cost evolution and stronger loot; taking a
  // card for Octrice's EX can temporarily switch both effects back off.
  const grave = opposite.cemetery.length;
  value += 0.28 * Math.min(grave, 10) + (ready ? 1.0 : 0);
  if (opposite.deckCount < 6) value += (6 - opposite.deckCount) * 0.40;
  return value;
}

function scoreLoot(view, seat, matchup, aggression) {
  const us = view.players[seat], foe = view.players[1 - seat];
  let score = lootValue(us, foe);
  if (matchup === 'mirror') score -= lootValue(foe, us);
  else {
    for (const c of foe.field) if (!c.hidden && !c.abilitiesLost) score -= enemyPriority[matchup][c.def] ?? 0;
  }
  // Play for the race, but preserve the life that pays for one more attack turn.
  score += aggression * (20 - foe.leaderDefense);
  score -= 0.25 * Math.max(0, 11 - us.leaderDefense);
  if (us.maxPlayPoints <= 4 && us.hand.some(c => is(c, BARBAROS))) score += 0.7;
  if (matchup === 'rune') {
    const psalm = foe.ex.filter(c => c.def === 'BP20-T05' || c.def === 'BP20-T06').length;
    if (psalm && us.leaderDefense <= 8) score -= 0.3 * (9 - us.leaderDefense);
  }
  return score;
}

export function buildPilot({ engine, rt, seat, matchup, seed }, tuning = {}) {
  const base = rt.MEDIUM_V2;
  const aggression = tuning.aggression ?? (matchup === 'dragon' ? 0.66 : matchup === 'rune' ? 0.50 : 0.30);
  const augment = evaluate => (view, player) => {
    const value = scoreLoot(view, seat, matchup, aggression);
    return evaluate(view, player) + (player === seat ? value : -value);
  };
  const planner = new rt.PlannerBot(engine, {
    ...base,
    cheat: false,
    seed,
    beamWidth: 17,
    maxBranches: 25,
    maxDepth: 22,
    maxSimulations: 1800,
    replyPlans: 5,
    innerPlans: [3, 3],
    innerSimulations: 240,
    innerBeam: 5,
    replyLethal: 130,
    lethalSearch: 1450,
    lethalChecks: 3,
    samples: 2,
    choiceDedupe: true,
    commonRandom: true,
    lineSlots: { lines: 3, margin: 3, key: 'set' },
    drawFirst: true,
    ...tuning.search,
    evaluator: augment(base.evaluator),
    replyEvaluator: augment(base.replyEvaluator),
    greedyEvaluator: augment(base.greedyEvaluator),
  });
  return {
    reason: null,
    get stats() { return planner.stats; },
    decide(game) {
      this.reason = null;
      const d = game.decision;
      if (d.type === 'mulligan') {
        const [redraw, reason] = opening(game.view(seat), seat, matchup);
        this.reason = reason;
        return { type: 'mulligan', redraw };
      }
      return planner.decide(game);
    },
  };
}

export const makePilot = buildPilot;
