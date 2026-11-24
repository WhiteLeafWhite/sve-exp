// The pilot reads only the player's view. Hidden samples are supplied by the rules engine.
export const profiles = {
  hunter: { title: '猎人妖', key: 'Z6kf6M', axis: '猎人堆墓与库璐璐纹章',
    early: ['BP06-013', 'BP20-012', 'BP20-015', 'BP15-012', 'BP05-012'],
    anchor: ['BP20-002', 'BP20-001', 'BP04-010'], field: { 'BP20-002': 1.2, 'BP05-004': 0.7 },
    ex: { 'BP20-T01': 0.9 }, race: 0.28, defense: 0.45 },
  fairy: { title: '妖精妖', key: '1DYwF7', axis: '妖精生成、阿玛兹与回手',
    early: ['BP16-001', 'BP16-015', 'BP01-011', 'BP13-013', 'BP06-003'],
    anchor: ['BP15-002', 'BP13-003', 'BP04-010'], field: { 'BP15-002': 1.2, 'BP13-003': 1.25, 'BP06-007': 0.7 },
    ex: {}, race: 0.54, defense: 0.25 },
  rally: { title: '铺场皇', key: 'csUWGv', axis: '铺场数、冲击与奥蕾莉亚',
    early: ['SP01-011', 'BP16-031', 'BP17-022', 'BP13-029', 'BP11-031', 'BP17-029'],
    anchor: ['BP17-019', 'BP18-023', 'BP20-022'], field: { 'BP17-022': 1.15, 'BP20-022': 1.25, 'BP19-022': 1.25 },
    ex: {}, race: 0.47, defense: 0.30 },
  destruction: { title: '破坏法', key: 'cQZr8Z', axis: '偶像献祭、直伤与回复',
    early: ['BP20-037', 'BP20-055', 'BP15-054', 'BP20-048', 'BP05-048'],
    anchor: ['BP15-045', 'BP08-050', 'BP20-040', 'BP05-045'], field: { 'BP20-T03': 1.05, 'BP20-T04': 1.45, 'BP05-T02': 0.95, 'BP05-T03': 1.35 },
    ex: { 'BP20-T03': 0.4, 'BP20-T04': 0.4 }, race: 0.31, defense: 0.48 },
  truth: { title: '真实法', key: 'h1LX3a', axis: '真实法术、减费与莱欧',
    early: ['BP20-049', 'BP20-038', 'BP20-053', 'BP15-047', 'BP05-046'],
    anchor: ['BP20-042', 'BP15-038', 'BP05-044', 'BP15-053'], field: { 'BP20-038': 0.95, 'BP20-042': 1.3, 'BP15-038': 0.95 },
    ex: {}, race: 0.26, defense: 0.53 },
  disdain: { title: '侮蔑龙', key: 'zQrwne', axis: '能力自伤、跳费与嘉鲁蜜儿',
    early: ['BP20-067', 'DSD01b-009', 'BP20-063', 'BP20-064', 'BP20-062', 'BP08-063'],
    anchor: ['BP20-056', 'BP05-052', 'BP05-055', 'BP15-057'], field: { 'BP20-062': 1.1, 'BP15-057': 2.0, 'BP05-052': 1.65 },
    ex: { 'BP20-T05': 1.5 }, race: 0.34, defense: 0.41 },
  ocean: { title: '海洋龙', key: 'd86IcJ', axis: '海洋蓄量、虎鲸与守护',
    early: ['SD08-010', 'BP20-060', 'BP11-067', 'BP07-059', 'BP16-064', 'BP17-067'],
    anchor: ['BP19-062', 'BP17-057', 'BP19-067', 'BP19-073'], field: { 'BP20-060': 0.9, 'BP17-057': 1.15, 'BP19-067': 1.2 },
    ex: {}, race: 0.20, defense: 0.59 },
  choice: { title: '混融梦', key: '8YKXr7', axis: '混融纹章、抉择与复活',
    early: ['BP20-086', 'BP11-075', 'BP19-088', 'BP02-112', 'BP20-082', 'BP15-113'],
    anchor: ['BP20-076', 'BP20-089', 'BP10-074', 'BP20-R11'], field: { 'BP20-086': 1.0, 'BP20-076': 1.25, 'BP20-081': 1.6 },
    ex: { 'BP20-T06': 1.3 }, race: 0.28, defense: 0.55 },
  bat: { title: '蝙蝠梦', key: 'twju4N', axis: '丛林蝙蝠进场、班比与拜特',
    early: ['BP09-082', 'BP09-083', 'BP18-096', 'BP16-085', 'BP02-069', 'BP18-080', 'BP18-084'],
    anchor: ['BP18-080', 'BP18-084', 'BP09-069', 'BP17-074'], field: { 'BP02-069': 1.1, 'BP18-080': 1.35, 'BP18-084': 1.2 },
    ex: {}, race: 0.61, defense: 0.25 },
  crest: { title: '纹章教', key: 'F5Jnyj', axis: '安息纹章、回合末压制与守护',
    early: ['BP20-103', 'BP20-094', 'BP20-101', 'BP08-092', 'BP19-100'],
    anchor: ['BP20-093', 'BP20-097', 'BP15-094', 'BP14-090'], field: { 'BP20-103': 0.65, 'BP14-090': 1.25, 'BP19-092': 1.15 },
    ex: { 'BP20-T07': 1.25, 'BP20-T08': 1.25 }, race: 0.20, defense: 0.67 },
};

const FLAG = 'BP19-T01';
const GUNNER = 'BP19-026';
const BARBAROS = 'BP19-019';
const HOLLOW = 'BP15-020';
const ORIGINAL = 'BP05-018';

function score(view, p) {
  const [ours, loot] = view.players;
  const flags = loot.ex.filter(c => c.def === FLAG).length;
  const threats = loot.field.filter(c => !c.hidden && !c.abilitiesLost);
  const ten = ours.cemetery.length >= 10;
  const gunner = threats.filter(c => c.def === GUNNER).length;
  const barbaros = threats.filter(c => c.def === BARBAROS);
  let value = (20 - loot.leaderDefense) * p.race;
  value -= p.defense * Math.max(0, 13 - ours.leaderDefense);
  value -= Math.min(flags, 4) * (0.44 + 0.12 * Math.min(gunner, 3));
  value -= gunner * (1.65 + 0.37 * Math.min(flags, 4));
  value -= barbaros.reduce((sum, c) => sum + (c.evolvedWith ? 3.1 : 1.25) + 0.32 * Math.min(flags, 4), 0);
  value -= threats.filter(c => c.def === HOLLOW).length * (1.1 + 0.30 * Math.min(loot.ex.length, 4));
  value -= threats.filter(c => c.def === ORIGINAL && c.evolvedWith).length * (ten ? 1.95 : 0.6);
  if (ten) value -= 0.85;
  for (const c of ours.field) if (!c.hidden && !c.abilitiesLost) value += p.field[c.def] ?? 0;
  for (const c of ours.ex) value += p.ex[c.def] ?? 0;
  return value;
}

function opening(view, p) {
  const hand = view.players[0].hand.filter(c => !c.hidden);
  const early = hand.filter(c => p.early.includes(c.def));
  const anchor = hand.filter(c => p.anchor.includes(c.def));
  if (early.length && anchor.some(c => !early.includes(c))) return [false, '保留早期动作与主轴后续'];
  if (new Set(early.map(c => c.def)).size >= 2) return [false, '保留两个不同的早期动作'];
  if (hand.filter(c => c.cost <= 2).length === 0) return [true, '缺少两费内动作，整手重抽'];
  return null;
}

export function makePilot({ engine, rt, p, seed }) {
  const base = rt.MEDIUM_NEXT;
  const augment = evaluate => (view, seat) => {
    const v = evaluate(view, seat);
    if (view.result) return v;
    return v + (seat === 0 ? 1 : -1) * score(view, p);
  };
  const planner = new rt.PlannerBot(engine, { ...base, cheat: false, seed, beamWidth: 9, maxSimulations: 850,
    maxBranches: 19, replyPlans: 4, lethalSearch: 1100, choiceDedupe: true, commonRandom: true, drawFirst: true,
    evaluator: augment(base.evaluator), replyEvaluator: augment(base.replyEvaluator), greedyEvaluator: augment(base.greedyEvaluator) });
  return {
    reason: '',
    get stats() { return planner.stats; },
    decide(game) {
      const view = game.view(0);
      if (view.decision.type === 'mulligan') {
        const decision = opening(view, p);
        if (decision) {
          const [redraw, reason] = decision;
          this.reason = reason;
          return { type: 'mulligan', redraw };
        }
        this.reason = '用本方可见信息模拟保留和整手重抽';
      }
      return planner.decide(game);
    },
  };
}
