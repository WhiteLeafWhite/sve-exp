// Keep Shion's Quick through the end of the Bishop turn. Only play it in a
// legal attack response on the next turn, after observing that attack.
export function choose({index,seat,view,answers}) {
  if(seat!==0)return null;
  const own=view.players[0], d=view.decision;
  if(view.turn===13 && index===123) {
    return answers.findIndex(a=>a.action?.type==='endMainPhase');
  }
  if(view.turn===13 && d.type==='selectCards' && d.reason==='wardEngage') {
    const shion=own.field.find(c=>c.def==='BP14-090');
    return answers.findIndex(a=>shion && a.cards?.includes(shion.id));
  }
  if(view.turn===14 && d.type==='quick' && d.timing==='attack') {
    const shield=own.ex.find(c=>c.def==='BP14-T07');
    const response=answers.findIndex(a=>shield && a.action?.card===shield.id);
    if(response>=0)return response;
  }
  return null;
}
