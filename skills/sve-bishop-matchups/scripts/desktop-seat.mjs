import { makeBishopPlayer } from "./bishop-player.mjs";

const matchups = { Runecraft:"cQZr8Z", Dragoncraft:"zQrwne", Swordcraft:"t7B32v" };
const craftOf = (engine, side) => side.leader ? engine.db.get(side.leader.def).class : null;

// Select a matchup from the two public leaders at the first decision. The
// player's hand, the opposing decklist and the shuffle are not used to identify it.
export function desktopBishop(engine, bots, seat, seed) {
  let player;
  return {
    decide(game) {
      if (!player) {
        const sides = game.view(seat).players;
        const key = matchups[craftOf(engine,sides[1-seat])];
        player = craftOf(engine,sides[seat]) === "Havencraft" && key
          ? makeBishopPlayer(engine, bots, {seat, opponentKey:key, seed:"bishop/"+seed, revision:3})
          : bots.createPresetBot(engine, "medium-v2", seed+":medium-v2:"+seat, 1);
      }
      return player.decide(game);
    }
  };
}

// Deploy the two actual practice seats on either side of a human. The strategy
// receives exactly the same redacted player view and answer list as on the table.
export function desktopDuel(engine, bots, seat, seed, policies) {
  let pilot, coach, key;
  return {
    decide(game) {
      if (!pilot) {
        const sides=game.view(seat).players;
        const own=craftOf(engine,sides[seat]), opposing=craftOf(engine,sides[1-seat]);
        const haven=own==="Havencraft";
        key=haven ? matchups[opposing] : opposing==="Havencraft" ? matchups[own] : undefined;
        coach=key ? (haven ? policies.bishop : policies.meta) : null;
        pilot=haven && key
          ? makeBishopPlayer(engine,bots,{seat,opponentKey:key,seed:"agent-counsel/"+seed,revision:coach?.baseRevision??3})
          : bots.createPresetBot(engine,"medium-v2","agent-counsel/"+seed+"/meta",1);
      }
      if (!coach) return pilot.decide(game);
      const legal=bots.enumerateAnswers(game.decision,180);
      if (legal.complete && legal.answers.length===1) return legal.answers[0];
      return policies.seatStrategy(game,seat,key,legal.answers,coach,pilot).input;
    }
  };
}
