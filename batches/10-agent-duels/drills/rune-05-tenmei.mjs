// T15: fetch Tenmei, then use three different healing sources against Safira.
// At the first decision after Safira leaves, both archived pilots resume.
export function choose({index,seat,view,answers}) {
  if(seat!==0 || view.turn!==15) return null;
  const [own,enemy]=view.players;
  const target=enemy.field.find(c=>c.def==='BP05-040');
  if(!target) return null;
  const d=view.decision;
  const chooseCard=id=>answers.findIndex(a=>a.cards?.length===1 && a.cards[0]===id);
  const byAction=(type,id)=>answers.findIndex(a=>a.action?.type===type && a.action.card===id);
  const onField=def=>own.field.find(c=>c.def===def)?.id;
  const inHand=def=>own.hand.find(c=>c.def===def)?.id;
  const city='BP18-120',tenmei='BP18-099',punisher='BP18-105';
  if(index===123)return byAction('play',inHand(city));
  if(d.type==='orderCards') {
    const order=['BP19-095','BP18-097'].map(def=>d.cards.find(c=>c.def===def)?.id);
    return answers.findIndex(a=>a.order?.length===2 && a.order.every((id,i)=>id===order[i]));
  }
  if(d.type==='selectCards') {
    if(d.reason==='effect' && d.source===onField(city))return chooseCard(d.candidates[d.candidateDefs.indexOf(tenmei)]);
    if(d.source===onField(tenmei))return chooseCard(target.id);
    if(d.reason==='target' && d.candidates.includes(onField(tenmei)))return chooseCard(onField(tenmei));
  }
  if(d.type==='mainPhase') {
    if(!onField(tenmei))return byAction('play',inHand(tenmei));
    if(!onField(punisher))return byAction('play',inHand(punisher));
    const useTenmei=byAction('activate',onField(tenmei));
    if(useTenmei>=0)return useTenmei;
    return byAction('activate',onField(city));
  }
  return null;
}
