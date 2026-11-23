import {choose as keepQuick} from "./royal-05-quicksilver.mjs";

export function choose(context) {
  const {seat, view, answers}=context;
  if(seat===0 && view.turn===13 && view.decision.reason==='wardEngage') {
    return answers.findIndex(a=>a.cards?.length===0);
  }
  return keepQuick(context);
}
