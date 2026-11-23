// T17: trigger two heals against one 3-defense Dragon. The two rehearsals
// differ only in which of the starting followers takes the 2+2 damage.
export function playToward(target, {seat,view,answers}) {
  if(seat!==0 || view.turn!==17)return null;
  const [own,opp]=view.players, d=view.decision;
  const enemy=opp.field.find(c=>!c.hidden&&c.def===target);
  const tenmei=own.field.find(c=>c.def==='BP18-099');
  const use=(type,id)=>answers.findIndex(a=>a.action?.type===type && a.action.card===id);
  if(d.type==='selectCards' && enemy && d.source===tenmei?.id && d.candidates.includes(enemy.id)){
    return answers.findIndex(a=>a.cards?.length===1 && a.cards[0]===enemy.id);
  }
  if(d.type!=='mainPhase')return null;
  if(!own.field.some(c=>c.def==='BP02-095'))return use('play',own.hand.find(c=>c.def==='BP02-095')?.id);
  if(!tenmei)return use('play',own.hand.find(c=>c.def==='BP18-099')?.id);
  const activate=use('activate',tenmei.id);
  if(activate>=0)return activate;
  return answers.findIndex(a=>a.action?.type==='endMainPhase');
}
export const choose=context=>playToward('BP05-055',context);
