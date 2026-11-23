// Commit the 6 PP Ward before the amulet. Leave the other 3 PP open and use
// its Quick in the first attack window of the following Dragon turn.
export function choose({index,seat,view,answers}) {
  if(seat!==0)return null;
  const own=view.players[0], d=view.decision;
  if(view.turn===17){
    if(index===146){
      const shion=own.hand.find(c=>c.def==='BP14-090');
      return answers.findIndex(a=>a.action?.type==='play' && a.action.card===shion?.id);
    }
    if(d.type==='selectCards' && d.reason==='wardEnterEngaged')return answers.findIndex(a=>a.cards?.length===0);
    if(d.type==='mainPhase')return answers.findIndex(a=>a.action?.type==='endMainPhase');
    if(d.type==='selectCards' && d.reason==='wardEngage'){
      const shion=own.field.find(c=>c.def==='BP14-090');
      return answers.findIndex(a=>a.cards?.includes(shion?.id));
    }
  }
  if(view.turn===18 && d.type==='quick' && d.timing==='attack'){
    const shield=own.ex.find(c=>!c.hidden&&c.def==='BP14-T07');
    const pick=answers.findIndex(a=>shield && a.action?.card===shield.id);
    if(pick>=0)return pick;
  }
  return null;
}
