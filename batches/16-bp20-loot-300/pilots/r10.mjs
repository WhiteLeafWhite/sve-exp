import { makePilot as playBurst } from './r7.mjs';

const BARB = 'BP19-019', GUN = 'BP19-026', FLAG = 'BP19-T01', MONO = 'BP05-045';

function recoverLine(view, seat) {
  const d = view.decision, me = view.players[seat], foe = view.players[1 - seat];
  if (d.type !== 'choose' || view.activePlayer !== seat || !d.options.some(o => o.id === 'recover') ||
      !d.options.some(o => o.id === 'destroy')) return null;
  if (me.playPoints >= 2 || me.maxPlayPoints < 3 || me.field.length >= 5 || me.ex.length > 3 ||
      foe.playPoints >= 2 || foe.ex.some(c => c.def === MONO)) return null;
  const crew = me.field.filter(c => !c.hidden && !c.abilitiesLost && c.def === BARB && c.evolvedWith);
  const gunner = me.hand.find(c => c.def === GUN && c.cost === 2);
  if (!gunner || crew.length !== 1 || crew[0].id !== d.source) return null;
  return { turn: view.turn, gunner: gunner.id, oldFlags: new Set(me.ex.filter(c => c.def === FLAG).map(c => c.id)), stage: 'gunner' };
}

export function makePilot(ctx) {
  const { seat } = ctx;
  const base = playBurst(ctx);
  let path = null;
  return {
    reason: null,
    get stats() { return base.stats; },
    decide(game) {
      this.reason = null;
      const view = game.view(seat), d = view.decision;
      if (path?.turn !== view.turn) path = null;
      if (path && d.type === 'mainPhase') {
        const { stage, gunner, oldFlags } = path;
        const flags = view.players[seat].ex.filter(c => c.def === FLAG && !oldFlags.has(c.id));
        const action = d.actions.find(a => a.type === 'play' && (stage === 'gunner' ? a.card === gunner : flags.some(c => c.id === a.card)));
        if (action) {
          this.reason = stage === 'gunner' ? '用首财宝回费买炮手，并补一面旗' : '新旗触发炮手，留下芭芭萝丝的破坏模式';
          path = stage === 'gunner' ? { ...path, stage: 'flag' } : null;
          return { type: 'mainPhase', action };
        }
        path = null;
      }
      const next = path ? null : recoverLine(view, seat);
      if (next) {
        path = next;
        this.reason = '对面空费，先回 2 PP 接炮手和新旗，再处理随从';
        return { type: 'choose', ids: ['recover'] };
      }
      const result = base.decide(game);
      this.reason = base.reason;
      return result;
    },
  };
}
