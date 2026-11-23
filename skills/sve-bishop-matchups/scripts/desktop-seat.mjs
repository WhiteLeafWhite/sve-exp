import { makeBishopPlayer } from "./bishop-player.mjs";

const matchups = { Runecraft:"cQZr8Z", Dragoncraft:"zQrwne", Swordcraft:"t7B32v" };

// Select a matchup from the two public leaders at the first decision. The
// player's hand, the opposing decklist and the shuffle are not used to identify it.
export function desktopBishop(engine, bots, seat, seed) {
  let player;
  return {
    decide(game) {
      if (!player) {
        const sides = game.view(seat).players;
        const craft = side => side.leader ? engine.db.get(side.leader.def).class : null;
        const key = matchups[craft(sides[1-seat])];
        player = craft(sides[seat]) === "Havencraft" && key
          ? makeBishopPlayer(engine, bots, {seat, opponentKey:key, seed:"bishop/"+seed, revision:3})
          : bots.createPresetBot(engine, "medium-v2", seed+":medium-v2:"+seat, 1);
      }
      return player.decide(game);
    }
  };
}
