// Begin with Whitefang and Punisher, then preserve Quicksilver through the
// opponent's first attack. Only the second rehearsal uses Pyromancy and combat.
export function defend(removeOne,{seat,view,answers}) {
  if(seat!==0)return null;
  const [own,opp]=view.players,d=view.decision;
  const use=(type,id)=>answers.findIndex(a=>a.action?.type===type && a.action.card===id);
  if(view.turn===15 && d.type==='quick' && d.timing==='attack'){
    const shield=own.ex.find(c=>!c.hidden && c.def==='BP14-T07');
    const pick=use('play',shield?.id);
    return pick>=0?pick:null;
  }
  if(view.turn!==14)return null;
  const zealots=opp.field.filter(c=>c.def==='BP08-050');
  const target=zealots.slice().sort((a,b)=>b.damage-a.damage)[0];
  if(removeOne && d.type==='selectCards' && target && d.candidates.includes(target.id)){
    return answers.findIndex(a=>a.cards?.length===1 && a.cards[0]===target.id);
  }
  if(d.type!=='mainPhase')return null;
  const fromHand=def=>own.hand.find(c=>c.def===def);
  const temple=fromHand('BP09-095'), body=fromHand('BP18-105');
  if(temple)return use('play',temple.id);
  if(body)return use('play',body.id);
  if(removeOne && zealots.length>=3 && target) {
    const pyro=fromHand('BP18-123');
    if(pyro && own.playPoints>=2)return use('play',pyro.id);
    const punisher=own.field.find(c=>c.def==='BP18-105');
    const evo=answers.findIndex(a=>punisher && a.action?.type==='evolve' && !a.action.superEvolve && a.action.card===punisher.id);
    if(evo>=0 && own.playPoints>=2)return evo;
    const trade=answers.findIndex(a=>a.action?.type==='attack' && a.action.target===target.id);
    if(trade>=0)return trade;
  }
  return answers.findIndex(a=>a.action?.type==='endMainPhase');
}
export const choose=context=>defend(false,context);
