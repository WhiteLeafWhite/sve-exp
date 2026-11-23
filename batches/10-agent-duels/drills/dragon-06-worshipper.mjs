// The City actually offers Pyromancy at input 142. Use its legal target and
// deploy both Elanas, with at least one PP kept for the next attack window.
export function protect(targetDef, {seat,view,answers}) {
  if(seat!==0)return null;
  const [own,opp]=view.players, d=view.decision;
  const select=id=>answers.findIndex(a=>a.cards?.length===1 && a.cards[0]===id);
  const use=(def,zone)=>{const c=zone.find(c=>!c.hidden&&c.def===def);
    return answers.findIndex(a=>c && a.action?.type==='play' && a.action.card===c.id)};
  if(view.turn===16){
    if(d.type==='selectCards'){
      if(d.reason==='wardEnterEngaged')return answers.findIndex(a=>a.cards?.length===0);
      if(d.reason==='wardEngage'){
        const ids=own.field.filter(c=>c.def==='BP18-100').map(c=>c.id);
        return answers.findIndex(a=>a.cards?.length===ids.length && ids.every(id=>a.cards.includes(id)));
      }
      const pyro=d.candidateDefs?.indexOf('BP18-123')??-1;
      if(pyro>=0)return select(d.candidates[pyro]);
      const enemy=opp.field.find(c=>c.def===targetDef);
      if(enemy && d.candidates.includes(enemy.id))return select(enemy.id);
    }
    if(d.type!=='mainPhase')return null;
    const city=use('BP18-120',own.hand);
    if(city>=0 && own.playPoints===8)return city;
    const pyro=use('BP18-123',own.hand);
    if(targetDef && pyro>=0 && opp.field.some(c=>c.def===targetDef))return pyro;
    const elana=use('BP18-100',own.hand);
    if(elana>=0 && own.playPoints>=3)return elana;
    return answers.findIndex(a=>a.action?.type==='endMainPhase');
  }
  if(view.turn===17 && d.type==='quick' && d.timing==='attack'){
    const shield=use('BP14-T07',own.ex);
    if(shield>=0)return shield;
    if(!targetDef){const pyro=use('BP18-123',own.hand);if(pyro>=0)return pyro}
  }
  if(view.turn===17 && !targetDef && d.type==='selectCards' && d.candidates?.length){
    const low=opp.field.filter(c=>c.type==='follower' && c.defense<=2 && d.candidates.includes(c.id));
    const target=low.find(c=>['BP05-052','BP05-053'].includes(c.def))??low.find(c=>c.def==='BP20-064')??low[0];
    if(target)return select(target.id);
  }
  return null;
}
export const choose=context=>protect('BP15-066',context);
