// After directly playing the discounted Saito at input 152, keep one PP. Use
// Quicksilver Aegis from public EX in the first legal enemy attack window.
export function choose({seat,view,answers}) {
  if(seat!==0)return null;
  if(view.turn===19&&view.decision.type==="mainPhase"){
    return answers.findIndex(a=>a.action?.type==="endMainPhase");
  }
  if(view.turn===20&&view.decision.type==="quick"&&view.decision.timing==="attack"){
    const silver=view.players[seat].ex.find(c=>!c.hidden&&c.def==="BP14-T07");
    if(silver){
      const idx=answers.findIndex(a=>a.action?.card===silver.id);
      if(idx>=0)return idx;
    }
  }
  return null;
}
