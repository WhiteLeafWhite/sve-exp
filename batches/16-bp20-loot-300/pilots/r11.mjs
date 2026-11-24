import { makePilot as onPlay } from './r7.mjs';
import { makePilot as onDraw } from './r8.mjs';

export function makePilot(ctx) {
  let pilot;
  return {
    reason: null,
    get stats() { return pilot?.stats ?? { simulations: 0, fallbacks: 0, simulationFailures: 0 }; },
    decide(game) {
      if (!pilot) {
        const first = game.view(ctx.seat).firstPlayer === ctx.seat;
        const make = first ? onPlay : onDraw;
        pilot = make({ ...ctx, seed: `${ctx.seed}/${first ? 'play' : 'draw'}` });
      }
      const result = pilot.decide(game);
      this.reason = pilot.reason;
      return result;
    },
  };
}
