import { makePilot as playTempo } from './r5.mjs';

const QUICK = 'BP15-026', SLASH = 'BP20-026', ZEALOT = 'BP08-050';
const THREATS = { 'BP20-048': 4, 'BP20-040': 3, 'BP05-048': 2.4, 'BP15-039': 2.2, 'BP20-037': 1.3 };

function chooseCut(view, seat, idols) {
  const d = view.decision;
  if (d.type !== 'mainPhase') return null;
  const me = view.players[seat], enemy = view.players[1 - seat];
  const nextPP = Math.min(10, enemy.maxPlayPoints + 1);
  if (nextPP < 3 || nextPP > 6 || enemy.leaderDefense <= 9 || me.leaderDefense <= 6) return null;
  const publicZealot = enemy.ex.some(c => c.def === ZEALOT) || enemy.hand.some(c => (c.hidden ? c.known?.def : c.def) === ZEALOT);
  if (me.maxPlayPoints > 3 && !publicZealot) return null;
  const field = enemy.field.filter(c => !c.hidden && idols.has(c.def));
  if (field.length !== 2) return null;
  const victims = field.filter(c => c.type === 'follower' && !c.keywords.includes('aura'))
    .sort((a, b) => (b.attack + (THREATS[b.def] ?? 0)) - (a.attack + (THREATS[a.def] ?? 0)));
  const available = [...me.hand, ...me.ex];
  for (const def of [QUICK, SLASH]) {
    const target = victims.find(c => c.defense <= (def === QUICK ? 2 : 4));
    const action = d.actions.find(a => a.type === 'play' && available.some(c => c.id === a.card && c.def === def));
    if (target && action) return { target: target.id, action };
  }
  return null;
}

export function makePilot(ctx) {
  const { engine, seat } = ctx;
  const openingIdols = new Set(engine.db.all().filter(c => c.traits.includes('アイドル')).map(c => c.id));
  const base = playTempo(ctx);
  let selected = null;
  return {
    reason: null,
    get stats() { return base.stats; },
    decide(game) {
      this.reason = null;
      const view = game.view(seat), d = view.decision;
      if (selected) {
        const victim = selected;
        selected = null;
        if (d.type === 'selectCards' && d.reason === 'target' && d.candidates.includes(victim)) {
          this.reason = '在对方下一次入场前移除第二个偶像';
          return { type: 'selectCards', cards: [victim] };
        }
      }
      const cut = chooseCut(view, seat, openingIdols);
      if (cut) {
        selected = cut.target;
        this.reason = '先把公开偶像降到一张，压低狂信者入场的收益';
        return { type: 'mainPhase', action: cut.action };
      }
      const result = base.decide(game);
      this.reason = base.reason;
      return result;
    },
  };
}
