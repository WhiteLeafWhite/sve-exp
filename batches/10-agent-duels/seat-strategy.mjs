// Run an archived seat's own strategy with its player view. Hidden instance IDs
// can encode deal order, so a hidden zone exposes only count and remembered cards.
export function seatStrategy(game, seat, key, answers, coach, pilot, viewVersion=2) {
  if(coach){
    const v=game.view(seat), side=v.players[1-seat];
    const mask=cards=>cards.map(c=>c.hidden?{hidden:true,...(viewVersion>=2&&c.known?{known:c.known}:{})}:c);
    const safe={...v,players:v.players.map((p,i)=>i===seat?p:{...side,hand:mask(p.hand),evolveDeck:mask(p.evolveDeck),banished:mask(p.banished),field:mask(p.field)})};
    const pick=coach.choose({seat,key,view:safe,answers});
    if(Number.isInteger(pick)&&answers[pick])return {input:answers[pick],authored:true};
  }
  return {input:pilot.decide(game),authored:false};
}
